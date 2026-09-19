-- Sprint 13 lote 2: equipe do professor sem organization_role.
-- Tenant tecnico hospeda a equipe. O professor nao vira owner/organizer/staff/finance.
begin;

create or replace function public.create_managed_team(team_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  actor uuid := auth.uid();
  clean_name text := trim(team_name);
  actor_name text;
  host_organization uuid;
  new_team uuid;
begin
  if actor is null then
    raise exception 'Autenticacao obrigatoria';
  end if;
  if length(clean_name) < 2 then
    raise exception 'Informe um nome de equipe valido';
  end if;

  select team_row.organization_id
    into host_organization
    from public.teams team_row
   where team_row.created_by = actor
   order by team_row.created_at
   limit 1;

  if host_organization is null then
    select nullif(trim(profile.nome_completo), '')
      into actor_name
      from public.profiles profile
     where profile.id = actor;
    insert into public.organizations(nome, slug, created_by)
      values (
        coalesce(actor_name, 'Equipe') || ' — equipes',
        replace(gen_random_uuid()::text, '-', ''),
        actor
      )
      returning id into host_organization;
  end if;

  insert into public.teams(organization_id, nome, created_by)
    values (host_organization, clean_name, actor)
    returning id into new_team;

  return new_team;
end;
$fn$;

create or replace function public.create_managed_athlete(
  target_team_id uuid,
  athlete_name text,
  athlete_birth_date date,
  athlete_gender text,
  athlete_belt text,
  athlete_weight numeric,
  relationship public.manager_relationship,
  athlete_cpf text default null,
  special_needs boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  target_organization_id uuid;
  team_owner uuid;
  new_athlete_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Autenticacao obrigatoria';
  end if;

  select organization_id, created_by
    into target_organization_id, team_owner
    from public.teams
   where id = target_team_id;

  if target_organization_id is null then
    raise exception 'Equipe inexistente';
  end if;

  if team_owner <> auth.uid()
     and not public.has_organization_role(
       target_organization_id,
       array['owner', 'organizer']::public.organization_role[]
     ) then
    raise exception 'Sem permissao na equipe';
  end if;

  insert into public.athletes (
    organization_id, nome_completo, cpf, data_nascimento, genero,
    faixa, peso_kg, team_id, possui_necessidade_especial
  ) values (
    target_organization_id, athlete_name, athlete_cpf, athlete_birth_date,
    athlete_gender, athlete_belt, athlete_weight, target_team_id, special_needs
  ) returning id into new_athlete_id;

  insert into public.athlete_managers (manager_id, athlete_id, relationship_type)
    values (auth.uid(), new_athlete_id, relationship);

  return new_athlete_id;
end;
$fn$;

comment on function public.create_managed_team(text) is
  'Cria a equipe do gestor autenticado. Usa tenant tecnico sem conceder organization_role.';

revoke all on function public.create_managed_team(text) from public;
grant execute on function public.create_managed_team(text) to authenticated;

revoke execute on function public.create_managed_athlete(uuid, text, date, text, text, numeric, public.manager_relationship, text, boolean) from public;
grant execute on function public.create_managed_athlete(uuid, text, date, text, text, numeric, public.manager_relationship, text, boolean) to authenticated;

commit;
