-- Sprint 9 Lote 1: areas, numero global e congelamento da programacao. Rollback integral.
begin;

do $$
declare
  owner uuid := gen_random_uuid();
  outsider uuid := gen_random_uuid();
  org uuid := gen_random_uuid();
  team uuid := gen_random_uuid();
  event uuid := gen_random_uuid();
  rules uuid := gen_random_uuid();
  category uuid := gen_random_uuid();
  solo_category uuid := gen_random_uuid();
  athletes uuid[] := array[
    gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(),
    gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(),
    gen_random_uuid()
  ];
  registrations uuid[] := array[
    gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(),
    gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(),
    gen_random_uuid()
  ];
  idx integer;
  athlete_name text;
  bracket uuid;
  solo_bracket uuid;
  target_group uuid;
  second_group uuid;
  area_one uuid;
  area_two uuid;
  target_schedule uuid;
  matches uuid[];
  second_matches uuid[];
  winner_entry uuid;
  reordered uuid[];
  before_numbers integer[];
  after_numbers integer[];
  payload jsonb;
  regenerated_bracket uuid;
  rejected boolean;
begin
  insert into auth.users(id, email, raw_user_meta_data) values
    (owner, owner::text || '@example.invalid', '{}'),
    (outsider, outsider::text || '@example.invalid', '{}');
  insert into public.organizations(id, nome, slug, created_by)
    values (org, 'Programacao smoke', org::text, owner);
  insert into public.organization_members(organization_id, user_id, role)
    values (org, owner, 'owner');
  insert into public.teams(id, organization_id, nome, created_by)
    values (team, org, 'Equipe programacao', owner);
  insert into public.events(
    id, organization_id, nome, slug, data_evento, local, status,
    checagem_travada_em, created_by, valor_inscricao
  ) values (
    event, org, 'Evento programacao', event::text, current_date,
    'Teste', 'checagem', now(), owner, 80
  );
  insert into public.category_rule_sets(id, event_id, nome, versao, ativo)
    values (rules, event, 'Programacao', 1, true);
  insert into public.event_categories(
    id, rule_set_id, nome, idade_min, idade_max, faixa_min_ordem,
    faixa_max_ordem, peso_min_kg, peso_max_kg, genero, ordem
  ) values
    (category, rules, 'Programacao N4', 18, 99, 1, 1, 0, 100, 'M', 1),
    (solo_category, rules, 'Programacao solo', 18, 99, 1, 1, 100.01, 150, 'M', 2);

  for idx in 1..9 loop
    athlete_name := 'Programacao atleta ' || idx::text;
    insert into public.athletes(
      id, organization_id, team_id, nome_completo, data_nascimento, genero, faixa, peso_kg
    ) values (
      athletes[idx], org, team, athlete_name,
      current_date - interval '25 years', 'M', 'Branca',
      case when idx = 9 then 110 else 80 end
    );
    insert into public.registrations(
      id, event_id, athlete_id, category_id, registered_by, status, valor,
      athlete_snapshot, category_snapshot, rule_set_version,
      terms_version, terms_accepted_at
    ) values (
      registrations[idx], event, athletes[idx],
      case when idx = 9 then solo_category else category end,
      owner, 'efetivada', 80,
      jsonb_build_object(
        'nome_completo', athlete_name,
        'data_nascimento', (current_date - interval '25 years')::date,
        'genero', 'M',
        'faixa', 'Branca',
        'peso_kg', case when idx = 9 then 110 else 80 end,
        'team_id', team,
        'team_name', 'Equipe programacao'
      ),
      jsonb_build_object('nome', case when idx = 9 then 'Programacao solo' else 'Programacao N4' end),
      1, 'MVP-2026-09', now()
    );
  end loop;

  perform set_config('request.jwt.claim.sub', owner::text, true);
  set local role authenticated;
  bracket := (public.generate_category_bracket(event, category)->>'bracketId')::uuid;
  solo_bracket := (public.generate_category_bracket(event, solo_category)->>'bracketId')::uuid;
  perform public.publish_category_bracket(bracket);
  perform public.publish_category_bracket(solo_bracket);
  reset role;
  update public.events set status = 'chaves' where id = event;
  set local role authenticated;

  select id into target_group
    from public.bracket_groups
   where bracket_id = bracket and label = 'A';
  select id into second_group
    from public.bracket_groups
   where bracket_id = bracket and label = 'B';
  select array_agg(id order by round, pair_index) into matches
    from public.bracket_matches
   where group_id = target_group;
  select array_agg(id order by round, pair_index) into second_matches
    from public.bracket_matches
   where group_id = second_group;
  if coalesce(array_length(matches, 1), 0) <> 3
     or coalesce(array_length(second_matches, 1), 0) <> 3 then
    raise exception 'FAIL: two semi4 groups should expose three matches each';
  end if;

  area_one := (public.save_event_area(event, null, 1, 'Verde')->>'areaId')::uuid;
  area_two := (public.save_event_area(event, null, 2, 'Azul')->>'areaId')::uuid;
  target_schedule := (select id from public.event_schedules where event_id = event);

  rejected := false;
  begin
    perform public.save_event_area(event, null, 1, 'Duplicada');
  exception when others then
    if sqlerrm <> 'Numero de area ja utilizado' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: duplicate area number accepted'; end if;

  payload := public.get_event_schedule_operation(event);
  if jsonb_array_length(payload->'groups') <> 2
     or payload #>> '{groups,0,areaId}' is not null then
    raise exception 'FAIL: solo should be excluded and group initially unassigned';
  end if;

  perform public.assign_schedule_group(target_group, area_one);
  perform public.assign_schedule_group(second_group, area_two);
  if (select count(distinct area_id) from public.event_schedule_groups where schedule_id = target_schedule) <> 2
     or (select count(*) from public.event_schedule_matches where schedule_id = target_schedule) <> 6 then
    raise exception 'FAIL: groups in different areas did not schedule every match once';
  end if;
  select array_agg(fight_number order by fight_number) into before_numbers
    from public.event_schedule_matches where schedule_id = target_schedule;
  if before_numbers <> array[1, 2, 3, 4, 5, 6] then
    raise exception 'FAIL: global numbering across areas is not continuous';
  end if;

  perform public.assign_schedule_group(target_group, area_two);
  if (select area_id from public.event_schedule_groups where group_id = target_group) <> area_two then
    raise exception 'FAIL: whole group did not move to area two';
  end if;

  reordered := array[matches[2], matches[1], matches[3]]
    || second_matches;
  perform public.reorder_event_schedule(event, reordered);
  select array_agg(match_id order by fight_number) into reordered
    from public.event_schedule_matches where schedule_id = target_schedule;
  if reordered <> (array[matches[2], matches[1], matches[3]] || second_matches) then
    raise exception 'FAIL: valid atomic reorder was not persisted';
  end if;

  select array_agg(fight_number order by match_id) into before_numbers
    from public.event_schedule_matches where schedule_id = target_schedule;
  rejected := false;
  begin
    perform public.reorder_event_schedule(
      event,
      array[matches[3], matches[1], matches[2]] || second_matches
    );
  exception when others then
    if sqlerrm <> 'Luta dependente deve permanecer depois das lutas de origem' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: final accepted before source semifinals'; end if;
  select array_agg(fight_number order by match_id) into after_numbers
    from public.event_schedule_matches where schedule_id = target_schedule;
  if after_numbers <> before_numbers then
    raise exception 'FAIL: rejected reorder changed numbering';
  end if;

  rejected := false;
  begin
    perform public.set_event_area_active(area_two, false);
  exception when others then
    if sqlerrm <> 'Area com subchave atribuida nao pode ser desativada' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: assigned area was deactivated'; end if;

  payload := public.publish_event_schedule(event);
  if payload->>'status' <> 'publicada'
     or (select status from public.event_schedules where id = target_schedule) <> 'publicada' then
    raise exception 'FAIL: schedule was not published';
  end if;

  rejected := false;
  begin
    perform public.assign_schedule_group(target_group, area_one);
  exception when others then
    if sqlerrm <> 'Programacao publicada nao pode ser alterada' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: published schedule accepted group move'; end if;

  rejected := false;
  begin
    perform public.reorder_event_schedule(
      event,
      array[matches[1], matches[2], matches[3]] || second_matches
    );
  exception when others then
    if sqlerrm <> 'Programacao publicada nao pode ser alterada' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: published fight numbers changed'; end if;

  rejected := false;
  payload := public.regenerate_category_bracket(bracket, 'Smoke de estabilidade da programacao');
  regenerated_bracket := (payload->>'bracketId')::uuid;
  if regenerated_bracket is null then
    raise exception 'FAIL: draft regeneration did not return bracket';
  end if;
  begin
    perform public.publish_category_bracket(regenerated_bracket);
  exception when others then
    if sqlerrm <> 'Chave vinculada a programacao publicada nao pode ser regenerada' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: regenerated bracket replaced published schedule structure'; end if;

  -- Simula um rascunho completo ainda não publicado para cobrir o congelamento automático no início.
  reset role;
  update public.event_schedules
     set status = 'draft', published_by = null, published_at = null
   where id = target_schedule;
  set local role authenticated;
  perform public.start_category_bracket(bracket);
  if (select status from public.event_schedules where id = target_schedule) <> 'publicada'
     or not exists (
       select 1 from public.event_audit_logs
        where event_id = event and action = 'event_schedule_published_on_start'
     ) then
    raise exception 'FAIL: event start did not freeze complete draft schedule';
  end if;
  select side_a_entry_id into winner_entry
    from public.bracket_matches
   where id = matches[1];
  perform public.record_bracket_match_outcome(
    matches[1],
    winner_entry,
    'wo'
  );
  select array_agg(fight_number order by match_id) into after_numbers
    from public.event_schedule_matches where schedule_id = target_schedule;
  if after_numbers <> before_numbers
     or (select count(*) from public.event_schedule_matches where schedule_id = target_schedule) <> 6
     or (select area_id from public.event_schedule_groups where group_id = target_group) <> area_two
     or not exists (
       select 1 from public.event_schedule_matches
        where schedule_id = target_schedule and match_id = matches[1]
     ) then
    raise exception 'FAIL: WO changed historical fight assignment';
  end if;

  reset role;
  perform set_config('request.jwt.claim.sub', outsider::text, true);
  set local role authenticated;
  rejected := false;
  begin
    perform public.get_event_schedule_operation(event);
  exception when others then
    if sqlerrm <> 'Sem permissao para consultar programacao' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: outsider read schedule'; end if;

  if exists (select 1 from public.event_schedules where id = target_schedule)
     or exists (select 1 from public.event_areas where schedule_id = target_schedule)
     or exists (select 1 from public.event_schedule_groups where schedule_id = target_schedule)
     or exists (select 1 from public.event_schedule_matches where schedule_id = target_schedule) then
    raise exception 'FAIL: outsider bypassed schedule RLS with direct SELECT';
  end if;

  rejected := false;
  begin
    perform public.save_event_area(event, null, 3, 'Amarela');
  exception when others then
    if sqlerrm <> 'Sem permissao para operar programacao' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: outsider changed schedule'; end if;

  reset role;
  perform set_config('request.jwt.claim.sub', owner::text, true);
  set local role authenticated;
  if not exists (
    select 1 from public.event_audit_logs
     where event_id = event and action = 'event_schedule_published'
  ) or not exists (
    select 1 from public.event_audit_logs
     where event_id = event and action = 'event_schedule_reordered'
  ) or not exists (
    select 1 from public.event_audit_logs
     where event_id = event and action = 'schedule_group_moved'
  ) then
    raise exception 'FAIL: schedule audit trail incomplete';
  end if;

  -- Nenhuma tabela operacional aceita escrita direta pelo cliente autenticado.
  rejected := false;
  begin
    update public.event_schedule_matches
       set fight_number = 99
     where schedule_id = target_schedule;
  exception when insufficient_privilege then
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: direct schedule update accepted'; end if;

  reset role;
end;
$$;

rollback;
