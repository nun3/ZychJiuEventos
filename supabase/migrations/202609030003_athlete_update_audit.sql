begin;

create or replace function public.update_managed_athlete(
  target_athlete_id uuid,
  target_team_id uuid,
  athlete_name text,
  athlete_birth_date date,
  athlete_gender text,
  athlete_belt text,
  athlete_weight numeric,
  athlete_cpf text default null,
  special_needs boolean default false,
  change_reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_athlete public.athletes%rowtype;
  target_team_organization_id uuid;
  updated_athlete public.athletes%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Autenticacao obrigatoria';
  end if;

  select * into current_athlete
  from public.athletes
  where id = target_athlete_id
  for update;

  if current_athlete.id is null then
    raise exception 'Atleta inexistente';
  end if;

  if not public.manages_athlete(target_athlete_id)
     and not public.has_organization_role(
       current_athlete.organization_id,
       array['owner', 'organizer']::public.organization_role[]
     ) then
    raise exception 'Sem permissao para editar este atleta';
  end if;

  select organization_id into target_team_organization_id
  from public.teams
  where id = target_team_id;

  if target_team_organization_id is null
     or target_team_organization_id <> current_athlete.organization_id then
    raise exception 'Equipe deve pertencer a mesma organizacao do atleta';
  end if;

  if current_athlete.team_id <> target_team_id
     and length(trim(coalesce(change_reason, ''))) < 3 then
    raise exception 'Motivo obrigatorio para troca de equipe';
  end if;

  update public.athletes
  set nome_completo = trim(athlete_name),
      cpf = nullif(regexp_replace(coalesce(athlete_cpf, ''), '\D', '', 'g'), ''),
      data_nascimento = athlete_birth_date,
      genero = athlete_gender,
      faixa = athlete_belt,
      peso_kg = athlete_weight,
      team_id = target_team_id,
      possui_necessidade_especial = special_needs,
      updated_at = now()
  where id = target_athlete_id
  returning * into updated_athlete;

  if current_athlete.team_id <> updated_athlete.team_id then
    insert into public.event_audit_logs (
      organization_id, actor_id, action, resource_type, resource_id,
      before_data, after_data, reason
    ) values (
      current_athlete.organization_id,
      auth.uid(),
      'athlete.team_changed',
      'athlete',
      current_athlete.id,
      jsonb_build_object('team_id', current_athlete.team_id),
      jsonb_build_object('team_id', updated_athlete.team_id),
      trim(change_reason)
    );
  end if;
end;
$$;

create or replace function public.link_athlete_to_current_user(target_athlete_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_athlete public.athletes%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Autenticacao obrigatoria';
  end if;

  select * into target_athlete
  from public.athletes
  where id = target_athlete_id
  for update;

  if target_athlete.id is null then
    raise exception 'Atleta inexistente';
  end if;

  if target_athlete.data_nascimento > (current_date - interval '18 years')::date then
    raise exception 'Somente atleta maior de idade pode vincular a propria conta';
  end if;

  if not public.manages_athlete(target_athlete_id)
     and not public.has_organization_role(
       target_athlete.organization_id,
       array['owner', 'organizer']::public.organization_role[]
     ) then
    raise exception 'Sem permissao para vincular este atleta';
  end if;

  if target_athlete.user_id is not null and target_athlete.user_id <> auth.uid() then
    raise exception 'Atleta ja vinculado a outra conta';
  end if;

  update public.athletes
  set user_id = auth.uid(), updated_at = now()
  where id = target_athlete_id;
end;
$$;

revoke execute on function public.update_managed_athlete(uuid, uuid, text, date, text, text, numeric, text, boolean, text) from public;
grant execute on function public.update_managed_athlete(uuid, uuid, text, date, text, text, numeric, text, boolean, text) to authenticated;

revoke execute on function public.link_athlete_to_current_user(uuid) from public;
grant execute on function public.link_athlete_to_current_user(uuid) to authenticated;

commit;
