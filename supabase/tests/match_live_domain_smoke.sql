-- MEU CAMP LIVE Lote 1 — smoke de autorizacao, integridade, idempotencia e lifecycle.
-- Fixtures com rollback. Nao aplica em producao; rodar apos a migration no ambiente de teste.
begin;

do $$
declare
  owner_a uuid := gen_random_uuid();
  organizer_a uuid := gen_random_uuid();
  staff_a uuid := gen_random_uuid();
  finance_a uuid := gen_random_uuid();
  stranger uuid := gen_random_uuid();
  org_a uuid := gen_random_uuid();
  org_b uuid := gen_random_uuid();
  owner_b uuid := gen_random_uuid();
  team uuid := gen_random_uuid();
  event_a uuid := gen_random_uuid();
  event_b uuid := gen_random_uuid();
  rules uuid := gen_random_uuid();
  category uuid := gen_random_uuid();
  athlete_1 uuid := gen_random_uuid();
  athlete_2 uuid := gen_random_uuid();
  registration_1 uuid := gen_random_uuid();
  registration_2 uuid := gen_random_uuid();
  v_bracket_id uuid;
  v_match_id uuid;
  v_area_a uuid;
  v_area_b uuid;
  session_payload jsonb;
  v_session_id uuid;
  v_version integer;
  v_score_event_id uuid;
  result jsonb;
  rejected boolean;
  public_payload jsonb;
begin
  insert into auth.users(id, email, raw_user_meta_data) values
    (owner_a, 'owner-a-' || owner_a::text || '@example.invalid', jsonb_build_object('nome_completo', 'Owner A', 'tipo_cadastro', 'organizador', 'data_nascimento', '1990-01-01')),
    (organizer_a, 'organizer-a-' || organizer_a::text || '@example.invalid', jsonb_build_object('nome_completo', 'Organizer A', 'tipo_cadastro', 'organizador', 'data_nascimento', '1990-01-01')),
    (staff_a, 'staff-a-' || staff_a::text || '@example.invalid', jsonb_build_object('nome_completo', 'Staff A', 'tipo_cadastro', 'organizador', 'data_nascimento', '1990-01-01')),
    (finance_a, 'finance-a-' || finance_a::text || '@example.invalid', jsonb_build_object('nome_completo', 'Finance A', 'tipo_cadastro', 'organizador', 'data_nascimento', '1990-01-01')),
    (stranger, 'stranger-' || stranger::text || '@example.invalid', jsonb_build_object('nome_completo', 'Stranger', 'tipo_cadastro', 'atleta', 'data_nascimento', '1990-01-01')),
    (owner_b, 'owner-b-' || owner_b::text || '@example.invalid', jsonb_build_object('nome_completo', 'Owner B', 'tipo_cadastro', 'organizador', 'data_nascimento', '1990-01-01'));

  insert into public.organizations(id, nome, slug, created_by) values
    (org_a, 'LIVE Org A', 'live-org-a-' || substr(replace(org_a::text, '-', ''), 1, 8), owner_a),
    (org_b, 'LIVE Org B', 'live-org-b-' || substr(replace(org_b::text, '-', ''), 1, 8), owner_b);
  insert into public.organization_members(organization_id, user_id, role) values
    (org_a, owner_a, 'owner'),
    (org_a, organizer_a, 'organizer'),
    (org_a, staff_a, 'staff'),
    (org_a, finance_a, 'finance'),
    (org_b, owner_b, 'owner');

  insert into public.teams(id, organization_id, nome, created_by) values (team, org_a, 'Equipe LIVE', owner_a);
  insert into public.events(
    id, organization_id, nome, slug, data_evento, local, status, checagem_travada_em, created_by, valor_inscricao
  ) values
    (event_a, org_a, 'Evento LIVE A', event_a::text, current_date, 'Tatame', 'checagem', now(), owner_a, 80),
    (event_b, org_b, 'Evento LIVE B', event_b::text, current_date, 'Tatame', 'em_andamento', now(), owner_b, 80);

  insert into public.category_rule_sets(id, event_id, nome, versao, ativo)
    values (rules, event_a, 'LIVE rules', 1, true);
  insert into public.event_categories(
    id, rule_set_id, nome, idade_min, idade_max, faixa_min_ordem, faixa_max_ordem,
    peso_min_kg, peso_max_kg, genero, ordem, fight_duration_minutes
  ) values (
    category, rules, 'Adulto LIVE', 18, 29, 1, 1, 0, 100, 'M', 1, 5
  );

  insert into public.athletes(id, organization_id, team_id, nome_completo, data_nascimento, genero, faixa, peso_kg) values
    (athlete_1, org_a, team, 'Atleta Um', current_date - interval '25 years', 'M', 'Branca', 80),
    (athlete_2, org_a, team, 'Atleta Dois', current_date - interval '25 years', 'M', 'Branca', 81);
  insert into public.registrations(
    id, event_id, athlete_id, category_id, registered_by, status, valor,
    athlete_snapshot, category_snapshot, rule_set_version, terms_version, terms_accepted_at
  ) values
    (registration_1, event_a, athlete_1, category, owner_a, 'efetivada', 80,
      jsonb_build_object('nome_completo', 'Atleta Um', 'data_nascimento', (current_date - interval '25 years')::date, 'genero', 'M', 'faixa', 'Branca', 'peso_kg', 80, 'team_id', team, 'team_name', 'Equipe LIVE'),
      jsonb_build_object('nome', 'Adulto LIVE'), 1, 'MVP-2026-09', now()),
    (registration_2, event_a, athlete_2, category, owner_a, 'efetivada', 80,
      jsonb_build_object('nome_completo', 'Atleta Dois', 'data_nascimento', (current_date - interval '25 years')::date, 'genero', 'M', 'faixa', 'Branca', 'peso_kg', 81, 'team_id', team, 'team_name', 'Equipe LIVE'),
      jsonb_build_object('nome', 'Adulto LIVE'), 1, 'MVP-2026-09', now());

  perform set_config('request.jwt.claim.sub', owner_a::text, true);
  set local role authenticated;
  v_bracket_id := (public.generate_category_bracket(event_a, category)->>'bracketId')::uuid;
  perform public.publish_category_bracket(v_bracket_id);
  reset role;
  update public.events set status = 'chaves' where id = event_a;

  perform set_config('request.jwt.claim.sub', owner_a::text, true);
  set local role authenticated;
  v_area_a := (public.save_event_area(event_a, null, 1, 'Area A')->>'areaId')::uuid;
  perform public.assign_schedule_group(
    (
      select bg.id
        from public.bracket_groups bg
       where bg.bracket_id = v_bracket_id
       limit 1
    ),
    v_area_a
  );
  perform public.publish_event_schedule(event_a);
  perform public.start_category_bracket(v_bracket_id);
  reset role;

  select bracket_match.id into v_match_id
    from public.bracket_matches bracket_match
    join public.bracket_groups bracket_group on bracket_group.id = bracket_match.group_id
   where bracket_group.bracket_id = v_bracket_id
   order by bracket_match.round, bracket_match.pair_index
   limit 1;

  -- Evento B com match alienigena: cria bracket minimo via seed direto so para FK.
  insert into public.category_rule_sets(id, event_id, nome, versao, ativo)
    values (gen_random_uuid(), event_b, 'B', 1, true);
  -- Usa um match inexistente UUID aleatorio para area cross-check e um match real de A.

  -- finance nao opera LIVE
  perform set_config('request.jwt.claim.sub', finance_a::text, true);
  set local role authenticated;
  rejected := false;
  begin
    perform public.create_match_live_session(v_match_id, v_area_a, 'idem-finance-create-01');
  exception when others then
    if sqlerrm not like '%Sem permissao para operar LIVE%' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: finance operou LIVE'; end if;
  reset role;

  -- authenticated sem membership nao opera
  perform set_config('request.jwt.claim.sub', stranger::text, true);
  set local role authenticated;
  rejected := false;
  begin
    perform public.create_match_live_session(v_match_id, v_area_a, 'idem-stranger-create-01');
  exception when others then
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: stranger operou LIVE'; end if;
  reset role;

  -- area de outro evento falha (cria area em org B)
  -- event_schedules_check: status publicada exige published_by + published_at
  insert into public.event_schedules(id, event_id, status, created_by, published_by, published_at)
    values (gen_random_uuid(), event_b, 'publicada', owner_b, owner_b, now());
  insert into public.event_areas(id, schedule_id, number, name, active)
    select gen_random_uuid(), schedule.id, 1, 'Area B', true
      from public.event_schedules schedule
     where schedule.event_id = event_b
    returning id into v_area_b;

  perform set_config('request.jwt.claim.sub', owner_a::text, true);
  set local role authenticated;
  rejected := false;
  begin
    perform public.create_match_live_session(v_match_id, v_area_b, 'idem-owner-bad-area-01');
  exception when others then
    if sqlerrm not like '%Area nao pertence ao evento%' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: area de outro evento aceita'; end if;

  -- staff cria sessao
  reset role;
  perform set_config('request.jwt.claim.sub', staff_a::text, true);
  set local role authenticated;
  session_payload := public.create_match_live_session(v_match_id, v_area_a, 'idem-staff-create-01');
  if session_payload->>'duplicate' <> 'false' then raise exception 'FAIL: create staff nao criou sessao'; end if;
  v_session_id := (session_payload->>'id')::uuid;
  v_version := (session_payload->>'version')::integer;

  -- create race / duplicate same payload
  result := public.create_match_live_session(v_match_id, v_area_a, 'idem-staff-create-01');
  if result->>'duplicate' <> 'true' then raise exception 'FAIL: create duplicate same payload'; end if;

  -- duplicate different payload (mesma key com create ja existente, outra tentativa via apply com mesma key)
  rejected := false;
  begin
    perform public.apply_match_live_action(
      v_session_id, v_version, 'call', 'idem-staff-create-01', null, null, null, null, null, '{}'::jsonb
    );
  exception when others then
    if sqlerrm not like '%Idempotency key reutilizada com comando diferente%' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: same key different command aceito'; end if;

  -- dois creates mesmo match → uma sessao
  rejected := false;
  begin
    perform public.create_match_live_session(v_match_id, v_area_a, 'idem-staff-create-02');
  exception when others then
    if sqlerrm not like '%Sessao LIVE ja existe%' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: segunda sessao para o mesmo match'; end if;
  if (select count(*) from public.match_live_sessions mls where mls.match_id = v_match_id) <> 1 then
    raise exception 'FAIL: mais de uma sessao para o match';
  end if;

  -- lifecycle + score
  result := public.apply_match_live_action(v_session_id, v_version, 'call', 'idem-call-01');
  v_version := (result->>'version')::integer;
  result := public.apply_match_live_action(v_session_id, v_version, 'on_mat', 'idem-onmat-01');
  v_version := (result->>'version')::integer;
  result := public.apply_match_live_action(v_session_id, v_version, 'start', 'idem-start-01');
  v_version := (result->>'version')::integer;

  rejected := false;
  begin
    perform public.apply_match_live_action(v_session_id, v_version - 1, 'score', 'idem-stale-01', 'a', 2);
  exception when others then
    if sqlerrm not like '%Conflito de versao LIVE%' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: version stale aceita'; end if;

  result := public.apply_match_live_action(v_session_id, v_version, 'score', 'idem-score-a2', 'a', 2);
  v_version := (result->>'version')::integer;
  v_score_event_id := (result->>'lastEventId')::uuid;
  if (result->>'scoreA')::integer <> 2 then raise exception 'FAIL: score A nao persistiu'; end if;

  result := public.apply_match_live_action(v_session_id, v_version, 'score', 'idem-score-a2', 'a', 2);
  if result->>'duplicate' <> 'true' then raise exception 'FAIL: score duplicate same payload'; end if;

  -- score fora de running
  result := public.apply_match_live_action(v_session_id, v_version, 'pause', 'idem-pause-01');
  v_version := (result->>'version')::integer;
  rejected := false;
  begin
    perform public.apply_match_live_action(v_session_id, v_version, 'score', 'idem-score-paused', 'b', 3);
  exception when others then
    if sqlerrm not like '%Transicao LIVE invalida%' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: score em paused aceito'; end if;

  result := public.apply_match_live_action(v_session_id, v_version, 'resume', 'idem-resume-01');
  v_version := (result->>'version')::integer;

  -- undo OK
  result := public.apply_match_live_action(v_session_id, v_version, 'undo', 'idem-undo-01', null, null, v_score_event_id);
  v_version := (result->>'version')::integer;
  if (result->>'scoreA')::integer <> 0 then raise exception 'FAIL: undo nao reverteu score'; end if;

  -- undo ja desfeito
  rejected := false;
  begin
    perform public.apply_match_live_action(v_session_id, v_version, 'undo', 'idem-undo-02', null, null, v_score_event_id);
  exception when others then
    if sqlerrm not like '%Acao ja desfeita%' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: undo repetido aceito'; end if;

  -- undo de start falha
  rejected := false;
  begin
    perform public.apply_match_live_action(
      v_session_id, v_version, 'undo', 'idem-undo-start', null, null,
      (select mle.id from public.match_live_events mle where mle.session_id = v_session_id and mle.type = 'start' limit 1)
    );
  exception when others then
    if sqlerrm not like '%Somente pontuacao pode ser desfeita%' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: undo de start aceito'; end if;

  -- undo outra session
  rejected := false;
  begin
    perform public.apply_match_live_action(
      v_session_id, v_version, 'undo', 'idem-undo-foreign', null, null, gen_random_uuid()
    );
  exception when others then
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: undo alvo inexistente aceito'; end if;

  result := public.apply_match_live_action(v_session_id, v_version, 'score', 'idem-score-b4', 'b', 4);
  v_version := (result->>'version')::integer;
  result := public.apply_match_live_action(
    v_session_id, v_version, 'finish', 'idem-finish-01', null, null, null, 'b', 'points', '{}'::jsonb
  );
  v_version := (result->>'version')::integer;
  if result->>'status' <> 'finished' then raise exception 'FAIL: finish nao persistiu'; end if;

  -- staff nao confirma
  rejected := false;
  begin
    perform public.apply_match_live_action(v_session_id, v_version, 'confirm', 'idem-confirm-staff');
  exception when others then
    if sqlerrm not like '%Sem permissao gerencial LIVE%' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: staff confirmou resultado'; end if;
  reset role;

  -- organizer confirma
  perform set_config('request.jwt.claim.sub', organizer_a::text, true);
  set local role authenticated;
  result := public.apply_match_live_action(v_session_id, v_version, 'confirm', 'idem-confirm-org');
  if result->>'status' <> 'confirmed' then raise exception 'FAIL: organizer nao confirmou'; end if;
  v_version := (result->>'version')::integer;

  rejected := false;
  begin
    perform public.apply_match_live_action(v_session_id, v_version, 'reopen', 'idem-reopen-after-confirm');
  exception when others then
    if sqlerrm not like '%terminal%' and sqlerrm not like '%Transicao LIVE invalida%' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: reopen apos confirmed aceito'; end if;

  rejected := false;
  begin
    perform public.apply_match_live_action(v_session_id, v_version, 'score', 'idem-score-after-confirm', 'a', 2);
  exception when others then
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: score apos confirmed aceito'; end if;
  reset role;

  -- anon nao escreve; contrato publico read-only
  set local role anon;
  rejected := false;
  begin
    perform public.create_match_live_session(v_match_id, v_area_a, 'idem-anon-create-01');
  exception when others then
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: anon escreveu LIVE'; end if;

  public_payload := public.get_public_event_live(event_a);
  if public_payload->>'kind' <> 'public_live' then raise exception 'FAIL: contrato publico ausente'; end if;
  if public_payload #>> '{sessions,0,operatorId}' is not null
     or public_payload #>> '{sessions,0,confirmedBy}' is not null then
    raise exception 'FAIL: contrato publico vazou campos administrativos';
  end if;
  reset role;

  raise notice 'PASS: match_live_domain_smoke';
end;
$$;

rollback;
