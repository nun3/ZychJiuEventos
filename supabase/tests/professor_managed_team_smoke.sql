-- Sprint 13 lote 2: professor cria equipe sem organization_role. Rollback.
begin;

do $$
declare
  professor uuid := gen_random_uuid();
  stranger uuid := gen_random_uuid();
  owner uuid := gen_random_uuid();
  org uuid := gen_random_uuid();
  team uuid;
  athlete uuid;
  rejected boolean;
begin
  insert into auth.users(id, email, raw_user_meta_data)
    values
      (professor, professor::text || '@example.invalid', jsonb_build_object('nome_completo', 'Professor smoke', 'tipo_cadastro', 'professor')),
      (stranger, stranger::text || '@example.invalid', jsonb_build_object('nome_completo', 'Estranho smoke', 'tipo_cadastro', 'atleta')),
      (owner, owner::text || '@example.invalid', jsonb_build_object('nome_completo', 'Owner smoke', 'tipo_cadastro', 'organizador'));
  insert into public.organizations(id, nome, slug, created_by)
    values (org, 'Org administrativa smoke', org::text, owner);
  insert into public.organization_members(organization_id, user_id, role)
    values (org, owner, 'owner');

  perform set_config('request.jwt.claim.sub', professor::text, true);
  set local role authenticated;
  team := public.create_managed_team('Equipe smoke professor');
  if team is null then raise exception 'FAIL: team not created'; end if;
  if exists (
    select 1 from public.organization_members
     where user_id = professor
  ) then
    raise exception 'FAIL: professor received organization_role';
  end if;

  athlete := public.create_managed_athlete(
    team, 'Atleta smoke professor', date '2000-01-01',
    'M', 'Branca', 70::numeric, 'professor'::public.manager_relationship, null::text, false
  );
  if athlete is null then raise exception 'FAIL: athlete not created'; end if;

  rejected := false;
  begin
    insert into public.events(
      organization_id, nome, slug, data_evento, local, status, created_by, valor_inscricao
    ) values (
      (select organization_id from public.teams where id = team),
      'Evento indevido', gen_random_uuid()::text, current_date, 'Teste', 'rascunho', professor, 80
    );
  exception when others then
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: professor created an event'; end if;
  reset role;

  perform set_config('request.jwt.claim.sub', stranger::text, true);
  set local role authenticated;
  rejected := false;
  begin
    perform public.create_managed_athlete(
      team, 'Atleta indevido', date '2000-01-01',
      'M', 'Branca', 70::numeric, 'professor'::public.manager_relationship, null::text, false
    );
  exception when others then
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: stranger wrote into professor team'; end if;
  reset role;
end;
$$;

rollback;
