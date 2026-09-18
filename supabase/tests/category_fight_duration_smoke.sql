-- Sprint 11: duracao oficial por categoria. Rollback integral.
-- Nao reabre resultados, areas, numeracao nem checklist operacional.
begin;

do $$
declare
  owner uuid := gen_random_uuid();
  outsider uuid := gen_random_uuid();
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
  payload jsonb;
  public_brackets jsonb;
  public_schedule jsonb;
  schedule_payload jsonb;
  checklist jsonb;
  rejected boolean;
begin
  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public'
       and table_name = 'bracket_matches'
       and column_name = 'fight_duration_minutes'
  ) or exists (
    select 1 from information_schema.columns
     where table_schema = 'public'
       and table_name = 'category_brackets'
       and column_name = 'fight_duration_minutes'
  ) then
    raise exception 'FAIL: duration was copied onto match or bracket';
  end if;

  insert into auth.users(id, email, raw_user_meta_data) values
    (owner, owner::text || '@example.invalid', '{}'),
    (outsider, outsider::text || '@example.invalid', '{}');
  insert into public.organizations(id, nome, slug, created_by)
    values (org, 'Duracao smoke', org::text, owner);
  insert into public.organization_members(organization_id, user_id, role)
    values (org, owner, 'owner');
  insert into public.teams(id, organization_id, nome, created_by) values
    (team_a, org, 'Equipe Alfa', owner),
    (team_b, org, 'Equipe Beta', owner);
  insert into public.events(
    id, organization_id, nome, slug, data_evento, local, status,
    checagem_travada_em, created_by, valor_inscricao
  ) values (
    event, org, 'Evento duracao', event::text, current_date,
    'Teste', 'checagem', now(), owner, 80
  );
  insert into public.category_rule_sets(id, event_id, nome, versao, ativo)
    values (rules, event, 'Duracao', 1, true);
  insert into public.event_categories(
    id, rule_set_id, nome, idade_min, idade_max, faixa_min_ordem,
    faixa_max_ordem, peso_min_kg, peso_max_kg, genero, ordem
  ) values (
    category, rules, 'Duracao N4', 18, 99, 1, 1, 0, 100, 'M', 1
  );

  if (select fight_duration_minutes from public.event_categories where id = category) is not null then
    raise exception 'FAIL: category without duration should stay null';
  end if;

  for idx in 1..4 loop
    athlete_name := 'Duracao atleta ' || idx::text;
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
      jsonb_build_object('nome', 'Duracao N4'),
      1, 'MVP-2026-09', now()
    );
  end loop;

  perform set_config('request.jwt.claim.sub', owner::text, true);
  set local role authenticated;

  rejected := false;
  begin
    perform public.set_event_category_duration(category, 0);
  exception when others then
    if sqlerrm <> 'Duracao da luta invalida' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: zero duration accepted'; end if;

  rejected := false;
  begin
    perform public.set_event_category_duration(category, 2.3);
  exception when others then
    if sqlerrm <> 'Duracao da luta invalida' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: fractional duration outside 0.5 step accepted'; end if;

  rejected := false;
  begin
    perform public.set_event_category_duration(category, 25);
  exception when others then
    if sqlerrm <> 'Duracao da luta invalida' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: oversized duration accepted'; end if;

  payload := public.set_event_category_duration(category, 2.5);
  if payload->>'kind' <> 'category_duration'
     or payload->>'categoryId' <> category::text
     or (payload->>'durationMinutes')::numeric is distinct from 2.5
     or (select fight_duration_minutes from public.event_categories where id = category) is distinct from 2.5 then
    raise exception 'FAIL: configured duration did not persist %', payload;
  end if;

  bracket := (public.generate_category_bracket(event, category)->>'bracketId')::uuid;
  perform public.publish_category_bracket(bracket);
  reset role;
  update public.events set status = 'chaves' where id = event;
  set local role authenticated;

  select id into target_group
    from public.bracket_groups
   where bracket_id = bracket and label = 'A';
  area_id := (public.save_event_area(event, null, 1, 'Verde')->>'areaId')::uuid;
  perform public.assign_schedule_group(target_group, area_id);
  perform public.publish_event_schedule(event);

  reset role;
  set local role anon;
  public_brackets := public.get_public_event_brackets(event);
  if (public_brackets->0->>'durationMinutes')::numeric is distinct from 2.5
     or public_brackets->0 ? 'categoryId'
     or public_brackets->0 ? 'bracketId'
     or public_brackets::text like '%matchId%' then
    raise exception 'FAIL: public brackets duration/projection %', public_brackets;
  end if;

  public_schedule := public.get_public_event_schedule(event);
  if public_schedule->>'kind' <> 'public_schedule'
     or jsonb_array_length(public_schedule->'matches') <> 3
     or (public_schedule #>> '{matches,0,durationMinutes}')::numeric is distinct from 2.5
     or public_schedule::text like '%matchId%'
     or public_schedule::text like '%areaId%'
     or public_schedule::text like '%scheduleId%'
     or public_schedule::text like '%entryId%'
     or public_schedule::text like '%groupId%'
     or public_schedule::text like '%categoryId%'
     or public_schedule::text like '%publishedBy%' then
    raise exception 'FAIL: public schedule duration/projection %', public_schedule;
  end if;

  rejected := false;
  begin
    perform public.set_event_category_duration(category, 3);
  exception when insufficient_privilege then
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: anon executed duration rpc'; end if;

  rejected := false;
  begin
    perform id from public.event_schedules limit 1;
  exception when insufficient_privilege then
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: anon administrative schedule read'; end if;

  reset role;
  perform set_config('request.jwt.claim.sub', owner::text, true);
  set local role authenticated;

  schedule_payload := public.get_event_schedule_operation(event);
  if schedule_payload->>'kind' <> 'schedule'
     or (schedule_payload #>> '{groups,0,durationMinutes}')::numeric is distinct from 2.5 then
    raise exception 'FAIL: admin schedule missing duration %', schedule_payload;
  end if;

  checklist := public.get_event_group_checklists(event);
  if checklist->>'kind' <> 'group_checklists'
     or checklist #>> '{groups,0,weighIn,status}' <> 'pendente' then
    raise exception 'FAIL: sprint 10 checklist regression %', checklist;
  end if;

  payload := public.set_event_category_duration(category, null);
  if (payload->>'durationMinutes') is not null
     or (select fight_duration_minutes from public.event_categories where id = category) is not null then
    raise exception 'FAIL: clearing duration did not persist %', payload;
  end if;

  reset role;
  set local role anon;
  public_schedule := public.get_public_event_schedule(event);
  if public_schedule #>> '{matches,0,durationMinutes}' is not null then
    raise exception 'FAIL: public schedule should omit empty duration %', public_schedule;
  end if;
  public_brackets := public.get_public_event_brackets(event);
  if public_brackets->0->>'durationMinutes' is not null then
    raise exception 'FAIL: public brackets should omit empty duration %', public_brackets;
  end if;

  reset role;
  perform set_config('request.jwt.claim.sub', outsider::text, true);
  set local role authenticated;
  rejected := false;
  begin
    perform public.set_event_category_duration(category, 3);
  exception when others then
    if sqlerrm <> 'Sem permissao para configurar categorias' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: outsider changed duration'; end if;
  if (select fight_duration_minutes from public.event_categories where id = category) is not null then
    raise exception 'FAIL: outsider wrote duration via RLS';
  end if;

  reset role;
  perform set_config('request.jwt.claim.sub', owner::text, true);
  set local role authenticated;
  payload := public.set_event_category_duration(category, 4);
  if (select fight_duration_minutes from public.event_categories where id = category) is distinct from 4 then
    raise exception 'FAIL: restored duration did not persist %', payload;
  end if;

  if not exists (
    select 1 from public.event_audit_logs
     where event_id = event and action = 'category_duration_updated'
  ) then
    raise exception 'FAIL: duration audit trail missing';
  end if;
end;
$$;

rollback;
