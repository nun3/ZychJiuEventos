-- Sprint 13 lote 3: professor operacional por inscricao. Rollback.
begin;

do $$
declare
  owner uuid := gen_random_uuid();
  professor uuid := gen_random_uuid();
  stranger uuid := gen_random_uuid();
  org uuid := gen_random_uuid();
  team uuid := gen_random_uuid();
  event uuid := gen_random_uuid();
  rule_id uuid := gen_random_uuid();
  category uuid := gen_random_uuid();
  athletes uuid[] := array[gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()];
  created_count integer;
  stored_name text;
  stored_user uuid;
  checking jsonb;
  schedule jsonb;
  bracket uuid;
  target_group uuid;
  area_id uuid;
  rejected boolean;
  idx integer;
begin
  insert into auth.users(id, email, raw_user_meta_data)
    values
      (owner, owner::text || '@example.invalid', jsonb_build_object('nome_completo', 'Owner smoke', 'tipo_cadastro', 'organizador')),
      (professor, professor::text || '@example.invalid', jsonb_build_object('nome_completo', 'Professor cadastral smoke', 'tipo_cadastro', 'professor')),
      (stranger, stranger::text || '@example.invalid', jsonb_build_object('nome_completo', 'Estranho smoke', 'tipo_cadastro', 'atleta'));
  insert into public.organizations(id, nome, slug, created_by)
    values (org, 'Org operacional smoke', org::text, owner);
  insert into public.organization_members(organization_id, user_id, role)
    values (org, owner, 'owner');
  insert into public.teams(id, organization_id, nome, created_by)
    values (team, org, 'Equipe unica smoke', professor);
  insert into public.athletes(id, organization_id, team_id, nome_completo, data_nascimento, genero, faixa, peso_kg)
    values
      (athletes[1], org, team, 'Atleta A smoke', date '2000-01-01', 'M', 'Branca', 70),
      (athletes[2], org, team, 'Atleta B smoke', date '2000-01-01', 'M', 'Branca', 70),
      (athletes[3], org, team, 'Atleta C smoke', date '2000-01-01', 'M', 'Branca', 70),
      (athletes[4], org, team, 'Atleta D smoke', date '2000-01-01', 'M', 'Branca', 70);
  insert into public.athlete_managers(athlete_id, manager_id, relationship_type)
    values
      (athletes[1], professor, 'professor'),
      (athletes[2], professor, 'professor'),
      (athletes[3], professor, 'professor'),
      (athletes[4], professor, 'professor');
  insert into public.events(
    id, organization_id, nome, slug, data_evento, local, status, created_by, valor_inscricao
  ) values (
    event, org, 'Evento operacional smoke', event::text, current_date + 30, 'Teste', 'inscricao', owner, 80
  );
  insert into public.event_phases(event_id, tipo, inicio, fim)
    values (event, 'inscricao', now() - interval '1 day', now() + interval '14 days');
  insert into public.category_rule_sets(id, event_id, nome, versao, ativo)
    values (rule_id, event, 'Operacional smoke', 1, true);
  insert into public.event_categories(
    id, rule_set_id, nome, idade_min, idade_max, faixa_min_ordem, faixa_max_ordem,
    peso_min_kg, peso_max_kg, genero, ordem
  ) values (category, rule_id, 'Leve operacional', 18, 99, 1, 10, 0, 120, 'M', 1);

  perform set_config('request.jwt.claim.sub', professor::text, true);
  set local role authenticated;
  select count(*) into created_count
    from public.create_event_registrations(
      event,
      array[athletes[1], athletes[2]],
      'MVP-2026-09',
      true,
      array['Treinador Alfa', 'Treinador Beta'],
      array[true, false]
    );
  if created_count <> 2 then raise exception 'FAIL: expected 2 registrations'; end if;
  reset role;

  select operational_professor_name, operational_professor_user_id
    into stored_name, stored_user
    from public.registrations
   where event_id = event and athlete_id = athletes[1];
  if stored_name is distinct from 'Treinador Alfa' or stored_user is distinct from professor then
    raise exception 'FAIL: first snapshot/link';
  end if;

  select operational_professor_name, operational_professor_user_id
    into stored_name, stored_user
    from public.registrations
   where event_id = event and athlete_id = athletes[2];
  if stored_name is distinct from 'Treinador Beta' or stored_user is not null then
    raise exception 'FAIL: second snapshot must stay independent';
  end if;
  if stored_name = 'Professor cadastral smoke' then
    raise exception 'FAIL: athlete_managers used as fallback';
  end if;

  perform set_config('request.jwt.claim.sub', stranger::text, true);
  set local role authenticated;
  rejected := false;
  begin
    perform public.create_event_registrations(
      event, array[athletes[3]], 'MVP-2026-09', true, array['Treinador Indevido'], array[true]
    );
  exception when others then
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: stranger wrote or linked a professor'; end if;
  reset role;

  update public.registrations set status = 'efetivada' where event_id = event;
  for idx in 3..4 loop
    insert into public.registrations(
      event_id, athlete_id, category_id, registered_by, status, valor,
      athlete_snapshot, category_snapshot, rule_set_version,
      terms_version, terms_accepted_at, operational_professor_name
    ) values (
      event, athletes[idx], category, owner, 'efetivada', 80,
      jsonb_build_object(
        'nome_completo', 'Atleta extra ' || idx::text,
        'data_nascimento', date '2000-01-01',
        'genero', 'M',
        'faixa', 'Branca',
        'peso_kg', 70,
        'team_id', team,
        'team_name', 'Equipe unica smoke'
      ),
      jsonb_build_object('nome', 'Leve operacional'),
      1, 'MVP-2026-09', now(),
      case idx when 3 then 'Treinador Gama' else 'Treinador Delta' end
    );
  end loop;

  update public.events set status = 'pagamento' where id = event;
  update public.events set status = 'checagem' where id = event;

  checking := public.get_public_event_checking(event);
  if checking->>'kind' is distinct from 'public_checking' then
    raise exception 'FAIL: checking kind';
  end if;
  if checking::text like '%' || professor::text || '%' or checking::text like '%' || owner::text || '%' then
    raise exception 'FAIL: account id leaked in checking';
  end if;
  if checking::text not like '%Treinador Alfa%' or checking::text not like '%Treinador Beta%' then
    raise exception 'FAIL: operational names missing from checking';
  end if;

  perform set_config('request.jwt.claim.sub', owner::text, true);
  set local role authenticated;
  if (public.lock_event_checagem(event)->>'kind') <> 'locked' then
    raise exception 'FAIL: lock checagem';
  end if;
  bracket := (public.generate_category_bracket(event, category)->>'bracketId')::uuid;
  perform public.publish_category_bracket(bracket);
  reset role;
  update public.events set status = 'chaves' where id = event;
  perform set_config('request.jwt.claim.sub', owner::text, true);
  set local role authenticated;
  select id into target_group from public.bracket_groups where bracket_id = bracket and label = 'A';
  area_id := (public.save_event_area(event, null, 1, 'Verde')->>'areaId')::uuid;
  perform public.assign_schedule_group(target_group, area_id);
  perform public.publish_event_schedule(event);
  reset role;

  schedule := public.get_public_event_schedule(event);
  if schedule->>'kind' is distinct from 'public_schedule' then
    raise exception 'FAIL: schedule kind';
  end if;
  if schedule::text like '%' || professor::text || '%' or schedule::text like '%@example.invalid%' then
    raise exception 'FAIL: account data leaked in schedule';
  end if;
  if schedule::text not like '%Treinador Alfa%'
     and schedule::text not like '%Treinador Beta%'
     and schedule::text not like '%Treinador Gama%'
     and schedule::text not like '%Treinador Delta%' then
    raise exception 'FAIL: operational professor missing from schedule %', schedule;
  end if;
end;
$$;

rollback;
