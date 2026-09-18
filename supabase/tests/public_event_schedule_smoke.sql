-- Sprint 9 Lote 2: projecao publica da programacao. Fixtures com rollback.
-- Nao reabre o contrato de areas, numeracao ou freeze ja aprovados.
begin;

do $$
declare
  owner uuid := gen_random_uuid();
  org uuid := gen_random_uuid();
  team_a uuid := gen_random_uuid();
  team_b uuid := gen_random_uuid();
  event uuid := gen_random_uuid();
  rules uuid := gen_random_uuid();
  category uuid := gen_random_uuid();
  athletes uuid[] := array[
    gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()
  ];
  registrations uuid[] := array[
    gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()
  ];
  idx integer;
  athlete_name text;
  team_id uuid;
  bracket uuid;
  target_group uuid;
  area_id uuid;
  matches uuid[];
  winner_entry uuid;
  draft_public jsonb;
  published_public jsonb;
  after_wo jsonb;
  before_numbers integer[];
  after_numbers integer[];
  rejected boolean;
begin
  insert into auth.users(id, email, raw_user_meta_data)
    values (owner, owner::text || '@example.invalid', '{}');
  insert into public.organizations(id, nome, slug, created_by)
    values (org, 'Programacao publica smoke', org::text, owner);
  insert into public.organization_members(organization_id, user_id, role)
    values (org, owner, 'owner');
  insert into public.teams(id, organization_id, nome, created_by) values
    (team_a, org, 'Equipe Alfa', owner),
    (team_b, org, 'Equipe Beta', owner);
  insert into public.events(
    id, organization_id, nome, slug, data_evento, local, status,
    checagem_travada_em, created_by, valor_inscricao
  ) values (
    event, org, 'Evento programacao publica', event::text, current_date,
    'Teste', 'checagem', now(), owner, 80
  );
  insert into public.category_rule_sets(id, event_id, nome, versao, ativo)
    values (rules, event, 'Programacao publica', 1, true);
  insert into public.event_categories(
    id, rule_set_id, nome, idade_min, idade_max, faixa_min_ordem,
    faixa_max_ordem, peso_min_kg, peso_max_kg, genero, ordem
  ) values (
    category, rules, 'Publica N4', 18, 99, 1, 1, 0, 100, 'M', 1
  );

  for idx in 1..4 loop
    athlete_name := 'Publico atleta ' || idx::text;
    team_id := case when idx % 2 = 0 then team_b else team_a end;
    insert into public.athletes(
      id, organization_id, team_id, nome_completo, data_nascimento, genero, faixa, peso_kg
    ) values (
      athletes[idx], org, team_id, athlete_name,
      current_date - interval '25 years', 'M', 'Branca', 80
    );
    insert into public.registrations(
      id, event_id, athlete_id, category_id, registered_by, status, valor,
      athlete_snapshot, category_snapshot, rule_set_version,
      terms_version, terms_accepted_at
    ) values (
      registrations[idx], event, athletes[idx], category, owner, 'efetivada', 80,
      jsonb_build_object(
        'nome_completo', athlete_name,
        'data_nascimento', (current_date - interval '25 years')::date,
        'genero', 'M',
        'faixa', 'Branca',
        'peso_kg', 80,
        'team_id', team_id,
        'team_name', case when team_id = team_a then 'Equipe Alfa' else 'Equipe Beta' end
      ),
      jsonb_build_object('nome', 'Publica N4'),
      1, 'MVP-2026-09', now()
    );
  end loop;

  perform set_config('request.jwt.claim.sub', owner::text, true);
  set local role authenticated;
  bracket := (public.generate_category_bracket(event, category)->>'bracketId')::uuid;
  perform public.publish_category_bracket(bracket);
  reset role;
  update public.events set status = 'chaves' where id = event;
  set local role authenticated;

  select id into target_group
    from public.bracket_groups
   where bracket_id = bracket and label = 'A';
  select array_agg(id order by round, pair_index) into matches
    from public.bracket_matches
   where group_id = target_group;

  area_id := (public.save_event_area(event, null, 1, 'Verde')->>'areaId')::uuid;
  perform public.assign_schedule_group(target_group, area_id);

  reset role;
  set local role anon;
  draft_public := public.get_public_event_schedule(event);
  if draft_public->>'kind' <> 'public_schedule'
     or jsonb_array_length(draft_public->'matches') <> 0
     or draft_public::text like '%draft%' then
    raise exception 'FAIL: draft schedule leaked to public projection';
  end if;

  reset role;
  perform set_config('request.jwt.claim.sub', owner::text, true);
  set local role authenticated;
  perform public.publish_event_schedule(event);
  select array_agg(fight_number order by fight_number) into before_numbers
    from public.event_schedule_matches
    join public.event_schedules schedule on schedule.id = schedule_id
   where schedule.event_id = event;

  reset role;
  set local role anon;
  published_public := public.get_public_event_schedule(event);
  if jsonb_array_length(published_public->'matches') <> 3
     or published_public #>> '{matches,0,fightNumber}' <> '1'
     or published_public #>> '{matches,1,fightNumber}' <> '2'
     or published_public #>> '{matches,2,fightNumber}' <> '3'
     or published_public #>> '{matches,0,areaName}' <> 'Verde'
     or published_public #>> '{matches,2,sideA,name}' not like 'Vencedor da luta %'
     or published_public #>> '{matches,2,sideA,resolved}' <> 'false'
     or published_public::text like '%matchId%'
     or published_public::text like '%areaId%'
     or published_public::text like '%scheduleId%'
     or published_public::text like '%entryId%'
     or published_public::text like '%groupId%'
     or published_public::text like '%publishedBy%' then
    raise exception 'FAIL: published public schedule %', published_public;
  end if;

  rejected := false;
  begin
    perform id from public.event_schedules limit 1;
  exception when insufficient_privilege then
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: anon administrative schedule read'; end if;

  rejected := false;
  begin
    perform public.get_event_schedule_operation(event);
  exception when insufficient_privilege then
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: anon operational schedule RPC'; end if;

  reset role;
  perform set_config('request.jwt.claim.sub', owner::text, true);
  set local role authenticated;
  perform public.start_category_bracket(bracket);
  select side_a_entry_id into winner_entry
    from public.bracket_matches
   where id = matches[1];
  perform public.record_bracket_match_outcome(matches[1], winner_entry, 'wo');
  select array_agg(fight_number order by fight_number) into after_numbers
    from public.event_schedule_matches
    join public.event_schedules schedule on schedule.id = schedule_id
   where schedule.event_id = event;
  if after_numbers <> before_numbers then
    raise exception 'FAIL: WO changed public historical numbers';
  end if;

  reset role;
  set local role anon;
  after_wo := public.get_public_event_schedule(event);
  if after_wo #>> '{matches,0,isWalkover}' <> 'true'
     or after_wo #>> '{matches,0,winner}' is null
     or after_wo #>> '{matches,2,sideA,resolved}' <> 'true'
     or after_wo #>> '{matches,0,fightNumber}' <> '1'
     or after_wo #>> '{matches,2,fightNumber}' <> '3' then
    raise exception 'FAIL: public projection did not reflect WO without renumbering %', after_wo;
  end if;

  reset role;
end;
$$;

rollback;
