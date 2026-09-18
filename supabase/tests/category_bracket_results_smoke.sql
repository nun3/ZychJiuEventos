-- Sprint 8: resultados, WO, avanco e colocacoes. Fixtures com rollback.
-- Pressupoe o dominio DRAFT/publicacao ja aprovado; testa somente o incremento operacional.
begin;

create function pg_temp.match_at(
  target_bracket uuid,
  group_label text,
  target_round public.match_round,
  target_pair integer
)
returns uuid
language sql
stable
as $$
  select bracket_match.id
    from public.bracket_matches bracket_match
    join public.bracket_groups bracket_group on bracket_group.id = bracket_match.group_id
   where bracket_group.bracket_id = target_bracket
     and bracket_group.label = group_label
     and bracket_match.round = target_round
     and bracket_match.pair_index = target_pair;
$$;

create function pg_temp.entry_at(target_bracket uuid, group_label text, target_slot integer)
returns uuid
language sql
stable
as $$
  select entry.id
    from public.bracket_entries entry
    join public.bracket_groups bracket_group on bracket_group.id = entry.group_id
   where bracket_group.bracket_id = target_bracket
     and bracket_group.label = group_label
     and entry.slot = target_slot;
$$;

do $$
declare
  owner uuid := gen_random_uuid();
  outsider uuid := gen_random_uuid();
  org uuid := gen_random_uuid();
  team_a uuid := gen_random_uuid();
  team_b uuid := gen_random_uuid();
  event uuid := gen_random_uuid();
  rules uuid := gen_random_uuid();
  cat_two uuid := gen_random_uuid();
  cat_three uuid := gen_random_uuid();
  cat_four uuid := gen_random_uuid();
  athletes uuid[] := array[
    gen_random_uuid(), gen_random_uuid(),
    gen_random_uuid(), gen_random_uuid(), gen_random_uuid(),
    gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()
  ];
  registrations uuid[] := array[
    gen_random_uuid(), gen_random_uuid(),
    gen_random_uuid(), gen_random_uuid(), gen_random_uuid(),
    gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()
  ];
  idx integer;
  category_id uuid;
  athlete_name text;
  team_id uuid;
  bracket_two uuid;
  bracket_three uuid;
  bracket_four uuid;
  match_id uuid;
  sf1 uuid;
  sf2 uuid;
  final_id uuid;
  side_a uuid;
  side_b uuid;
  sf1_winner uuid;
  sf2_winner uuid;
  operation jsonb;
  public_payload jsonb;
  rejected boolean;
begin
  insert into auth.users(id, email, raw_user_meta_data) values
    (owner, owner::text || '@example.invalid', '{}'),
    (outsider, outsider::text || '@example.invalid', '{}');
  insert into public.organizations(id, nome, slug, created_by)
    values (org, 'Resultados smoke', org::text, owner);
  insert into public.organization_members(organization_id, user_id, role)
    values (org, owner, 'owner');
  insert into public.teams(id, organization_id, nome, created_by) values
    (team_a, org, 'Equipe A', owner),
    (team_b, org, 'Equipe B', owner);
  insert into public.events(
    id, organization_id, nome, slug, data_evento, local, status,
    checagem_travada_em, created_by, valor_inscricao
  ) values (
    event, org, 'Evento resultados', event::text, current_date,
    'Teste', 'checagem', now(), owner, 80
  );
  insert into public.category_rule_sets(id, event_id, nome, versao, ativo)
    values (rules, event, 'Resultados', 1, true);
  insert into public.event_categories(
    id, rule_set_id, nome, idade_min, idade_max, faixa_min_ordem,
    faixa_max_ordem, peso_min_kg, peso_max_kg, genero, ordem
  ) values
    (cat_two, rules, 'Resultado N2', 18, 99, 1, 1, 0, 80, 'M', 1),
    (cat_three, rules, 'Resultado N3', 18, 99, 1, 1, 80.01, 90, 'M', 2),
    (cat_four, rules, 'Resultado N4', 18, 99, 1, 1, 90.01, 100, 'M', 3);

  for idx in 1..9 loop
    category_id := case when idx <= 2 then cat_two when idx <= 5 then cat_three else cat_four end;
    athlete_name := 'Resultado atleta ' || idx::text;
    team_id := case when idx % 2 = 0 then team_b else team_a end;

    insert into public.athletes(
      id, organization_id, team_id, nome_completo, data_nascimento, genero, faixa, peso_kg
    ) values (
      athletes[idx], org, team_id, athlete_name,
      current_date - interval '25 years', 'M', 'Branca',
      case when idx <= 2 then 75 when idx <= 5 then 85 else 95 end
    );
    insert into public.registrations(
      id, event_id, athlete_id, category_id, registered_by, status, valor,
      athlete_snapshot, category_snapshot, rule_set_version,
      terms_version, terms_accepted_at
    ) values (
      registrations[idx], event, athletes[idx], category_id, owner, 'efetivada', 80,
      jsonb_build_object(
        'nome_completo', athlete_name,
        'data_nascimento', (current_date - interval '25 years')::date,
        'genero', 'M',
        'faixa', 'Branca',
        'peso_kg', case when idx <= 2 then 75 when idx <= 5 then 85 else 95 end,
        'team_id', team_id,
        'team_name', case when team_id = team_a then 'Equipe A' else 'Equipe B' end
      ),
      jsonb_build_object(
        'nome', case when idx <= 2 then 'Resultado N2' when idx <= 5 then 'Resultado N3' else 'Resultado N4' end
      ),
      1, 'MVP-2026-09', now()
    );
  end loop;

  perform set_config('request.jwt.claim.sub', owner::text, true);
  set local role authenticated;

  bracket_two := (public.generate_category_bracket(event, cat_two)->>'bracketId')::uuid;
  bracket_three := (public.generate_category_bracket(event, cat_three)->>'bracketId')::uuid;
  bracket_four := (public.generate_category_bracket(event, cat_four)->>'bracketId')::uuid;
  perform public.publish_category_bracket(bracket_two);
  perform public.publish_category_bracket(bracket_three);
  perform public.publish_category_bracket(bracket_four);

  reset role;
  update public.events set status = 'chaves' where id = event;
  set local role authenticated;

  -- final_2: inicio atomico do evento, vencedor normal e colocacoes.
  operation := public.start_category_bracket(bracket_two);
  if operation->>'status' <> 'em_andamento'
     or (select status from public.events where id = event) <> 'em_andamento' then
    raise exception 'FAIL: start did not advance bracket/event';
  end if;

  match_id := pg_temp.match_at(bracket_two, 'A', 'final', 1);
  side_a := pg_temp.entry_at(bracket_two, 'A', 1);
  side_b := pg_temp.entry_at(bracket_two, 'A', 2);

  rejected := false;
  begin
    perform public.record_bracket_match_outcome(
      match_id,
      pg_temp.entry_at(bracket_three, 'A', 1),
      'concluido'
    );
  exception when others then
    if sqlerrm <> 'Vencedor nao pertence ao confronto' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: invalid winner accepted'; end if;

  operation := public.record_bracket_match_outcome(match_id, side_a, 'concluido');
  if operation->>'status' <> 'concluida'
     or operation #>> '{groups,0,placements,0,place}' <> '1'
     or operation #>> '{groups,0,placements,0,athlete,entryId}' <> side_a::text
     or operation #>> '{groups,0,placements,1,place}' <> '2'
     or operation #>> '{groups,0,placements,1,athlete,entryId}' <> side_b::text then
    raise exception 'FAIL: final_2 placements %', operation;
  end if;

  rejected := false;
  begin
    perform public.record_bracket_match_outcome(match_id, side_b, 'concluido');
  exception when others then
    if sqlerrm <> 'Chave fora de operacao' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: duplicate result accepted'; end if;

  rejected := false;
  begin
    perform public.regenerate_category_bracket(bracket_two, 'Tentativa apos resultado');
  exception when others then
    if sqlerrm <> 'Evento fora da fase de chaves' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: regenerate after result'; end if;
  reset role;
  if not public.bracket_has_results(bracket_two) then
    raise exception 'FAIL: result guard did not detect outcome';
  end if;
  set local role authenticated;

  -- copo_3: final bloqueada, WO real na semifinal e copo sem match ficticio.
  perform public.start_category_bracket(bracket_three);
  sf1 := pg_temp.match_at(bracket_three, 'A', 'semifinal', 1);
  final_id := pg_temp.match_at(bracket_three, 'A', 'final', 1);
  sf1_winner := pg_temp.entry_at(bracket_three, 'A', 1);

  rejected := false;
  begin
    perform public.record_bracket_match_outcome(
      final_id,
      pg_temp.entry_at(bracket_three, 'A', 2),
      'concluido'
    );
  exception when others then
    if sqlerrm <> 'Confronto ainda sem os dois lados resolvidos' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: unresolved final accepted'; end if;

  perform public.record_bracket_match_outcome(sf1, sf1_winner, 'wo');
  if (select status from public.bracket_matches where id = sf1) <> 'wo'
     or (select count(*) from public.bracket_matches m join public.bracket_groups g on g.id = m.group_id where g.bracket_id = bracket_three) <> 2
     or (select count(*) from public.bracket_matches m join public.bracket_groups g on g.id = m.group_id where g.bracket_id = bracket_three and m.status = 'wo') <> 1 then
    raise exception 'FAIL: WO/copo semantics';
  end if;

  operation := public.get_category_bracket_operation(bracket_three);
  if operation #>> '{groups,0,matches,1,sideA,entryId}' <> sf1_winner::text
     or operation #>> '{groups,0,matches,1,sideB,entryId}' <> pg_temp.entry_at(bracket_three, 'A', 2)::text then
    raise exception 'FAIL: copo advance %', operation;
  end if;
  operation := public.record_bracket_match_outcome(
    final_id,
    pg_temp.entry_at(bracket_three, 'A', 2),
    'concluido'
  );
  if operation->>'status' <> 'concluida'
     or jsonb_array_length(operation #> '{groups,0,placements}') <> 3
     or operation #>> '{groups,0,placements,0,athlete,entryId}' <> pg_temp.entry_at(bracket_three, 'A', 2)::text
     or operation #>> '{groups,0,placements,1,athlete,entryId}' <> sf1_winner::text
     or operation #>> '{groups,0,placements,2,place}' <> '3'
     or operation #>> '{groups,0,placements,2,athlete,entryId}' <> pg_temp.entry_at(bracket_three, 'A', 3)::text then
    raise exception 'FAIL: copo placements %', operation;
  end if;

  -- semi_4: duas semifinais, uma por WO, avanco e dois terceiros.
  perform public.start_category_bracket(bracket_four);
  sf1 := pg_temp.match_at(bracket_four, 'A', 'semifinal', 1);
  sf2 := pg_temp.match_at(bracket_four, 'A', 'semifinal', 2);
  final_id := pg_temp.match_at(bracket_four, 'A', 'final', 1);
  sf1_winner := pg_temp.entry_at(bracket_four, 'A', 1);
  sf2_winner := pg_temp.entry_at(bracket_four, 'A', 2);

  perform set_config('request.jwt.claim.sub', outsider::text, true);
  rejected := false;
  begin
    perform public.record_bracket_match_outcome(sf1, sf1_winner, 'concluido');
  exception when others then
    if sqlerrm <> 'Sem permissao para operar chaves' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: outsider result accepted'; end if;
  perform set_config('request.jwt.claim.sub', owner::text, true);

  perform public.record_bracket_match_outcome(sf1, sf1_winner, 'concluido');
  perform public.record_bracket_match_outcome(sf2, sf2_winner, 'wo');
  operation := public.get_category_bracket_operation(bracket_four);
  if operation #>> '{groups,0,matches,2,sideA,entryId}' <> sf1_winner::text
     or operation #>> '{groups,0,matches,2,sideB,entryId}' <> sf2_winner::text then
    raise exception 'FAIL: semi_4 advance %', operation;
  end if;

  operation := public.record_bracket_match_outcome(final_id, sf1_winner, 'concluido');
  if operation->>'status' <> 'concluida'
     or jsonb_array_length(operation #> '{groups,0,placements}') <> 4
     or operation #>> '{groups,0,placements,0,athlete,entryId}' <> sf1_winner::text
     or operation #>> '{groups,0,placements,1,athlete,entryId}' <> sf2_winner::text
     or operation #>> '{groups,0,placements,2,place}' <> '3'
     or operation #>> '{groups,0,placements,2,athlete,entryId}' <> pg_temp.entry_at(bracket_four, 'A', 3)::text
     or operation #>> '{groups,0,placements,3,place}' <> '3'
     or operation #>> '{groups,0,placements,3,athlete,entryId}' <> pg_temp.entry_at(bracket_four, 'A', 4)::text then
    raise exception 'FAIL: semi_4 placements %', operation;
  end if;

  -- Trigger impede update direto mesmo para o executor tecnico do smoke.
  reset role;
  rejected := false;
  begin
    update public.bracket_matches set status = 'pendente', winner_entry_id = null where id = match_id;
  exception when others then
    if sqlerrm <> 'Resultado de confronto so pode ser alterado pela operacao autorizada' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: direct result update accepted'; end if;

  -- Projecao publica mostra resultados/WO sem IDs e mantem tabelas administrativas fechadas.
  set local role anon;
  public_payload := public.get_public_event_brackets(event);
  if jsonb_array_length(public_payload) <> 3
     or public_payload::text not like '%"isWalkover": true%'
     or public_payload::text not like '%"placements"%'
     or public_payload::text like '%entryId%'
     or public_payload::text like '%matchId%' then
    raise exception 'FAIL: public outcomes projection %', public_payload;
  end if;

  rejected := false;
  begin
    perform id from public.bracket_matches limit 1;
  exception when insufficient_privilege then
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: anon administrative match read'; end if;

  rejected := false;
  begin
    perform public.get_category_bracket_operation(bracket_two);
  exception when insufficient_privilege then
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: anon operational read RPC'; end if;

  rejected := false;
  begin
    perform public.start_category_bracket(bracket_two);
  exception when insufficient_privilege then
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: anon start RPC'; end if;

  rejected := false;
  begin
    perform public.record_bracket_match_outcome(match_id, side_a, 'concluido'::public.match_status);
  exception when insufficient_privilege then
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: anon outcome RPC'; end if;

  rejected := false;
  begin
    perform public.bracket_resolve_match_side(match_id, 'A');
  exception when insufficient_privilege then
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: anon internal helper'; end if;

  reset role;
  if (select count(*) from public.event_audit_logs audit where audit.event_id = event and action = 'bracket_match_outcome_recorded') <> 6 then
    raise exception 'FAIL: result audit count';
  end if;
end;
$$;

rollback;
