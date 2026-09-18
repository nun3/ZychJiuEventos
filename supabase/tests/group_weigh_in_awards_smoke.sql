-- Sprint 10: pesagem e premiacao operacional por subchave. Rollback integral.
-- Nao reabre resultados, areas, numeracao nem pesagem individual.
begin;

create function pg_temp.entry_at(target_bracket uuid, target_slot integer)
returns uuid
language sql
stable
as $$
  select entry.id
    from public.bracket_entries entry
    join public.bracket_groups bracket_group on bracket_group.id = entry.group_id
   where bracket_group.bracket_id = target_bracket
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
  category uuid := gen_random_uuid();
  athletes uuid[] := array[gen_random_uuid(), gen_random_uuid()];
  registrations uuid[] := array[gen_random_uuid(), gen_random_uuid()];
  idx integer;
  athlete_name text;
  team_id uuid;
  bracket uuid;
  target_group uuid;
  match_id uuid;
  winner_entry uuid;
  payload jsonb;
  before_status public.match_status;
  before_winner uuid;
  rejected boolean;
begin
  insert into auth.users(id, email, raw_user_meta_data) values
    (owner, owner::text || '@example.invalid', '{}'),
    (outsider, outsider::text || '@example.invalid', '{}');
  insert into public.organizations(id, nome, slug, created_by)
    values (org, 'Checklist smoke', org::text, owner);
  insert into public.organization_members(organization_id, user_id, role)
    values (org, owner, 'owner');
  insert into public.teams(id, organization_id, nome, created_by) values
    (team_a, org, 'Equipe A', owner),
    (team_b, org, 'Equipe B', owner);
  insert into public.events(
    id, organization_id, nome, slug, data_evento, local, status,
    checagem_travada_em, created_by, valor_inscricao
  ) values (
    event, org, 'Evento checklist', event::text, current_date,
    'Teste', 'checagem', now(), owner, 80
  );
  insert into public.category_rule_sets(id, event_id, nome, versao, ativo)
    values (rules, event, 'Checklist', 1, true);
  insert into public.event_categories(
    id, rule_set_id, nome, idade_min, idade_max, faixa_min_ordem,
    faixa_max_ordem, peso_min_kg, peso_max_kg, genero, ordem
  ) values (
    category, rules, 'Checklist N2', 18, 99, 1, 1, 0, 100, 'M', 1
  );

  for idx in 1..2 loop
    athlete_name := 'Checklist atleta ' || idx::text;
    team_id := case when idx = 1 then team_a else team_b end;
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
        'team_name', case when team_id = team_a then 'Equipe A' else 'Equipe B' end
      ),
      jsonb_build_object('nome', 'Checklist N2'),
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
   where bracket_id = bracket
     and label = 'A';
  select id, status, winner_entry_id into match_id, before_status, before_winner
    from public.bracket_matches
   where group_id = target_group
     and round = 'final';

  payload := public.get_event_group_checklists(event);
  if payload->>'kind' <> 'group_checklists'
     or payload #>> '{groups,0,weighIn,status}' <> 'pendente'
     or payload #>> '{groups,0,awards,status}' <> 'pendente'
     or payload #>> '{groups,0,resultStatus}' <> 'pendente' then
    raise exception 'FAIL: new group did not start pending %', payload;
  end if;

  payload := public.confirm_bracket_group_weigh_in(target_group);
  if payload #>> '{weighIn,status}' <> 'realizada'
     or payload #>> '{weighIn,confirmedBy}' <> owner::text
     or payload #>> '{weighIn,confirmedAt}' is null then
    raise exception 'FAIL: weigh-in did not persist operator/time %', payload;
  end if;
  if (select status from public.bracket_matches where id = match_id) is distinct from before_status
     or (select winner_entry_id from public.bracket_matches where id = match_id) is distinct from before_winner then
    raise exception 'FAIL: weigh-in changed match result';
  end if;
  if exists (select 1 from public.event_schedules where event_id = event) then
    raise exception 'FAIL: weigh-in created schedule residue';
  end if;

  rejected := false;
  begin
    perform public.confirm_bracket_group_awards(target_group);
  exception when others then
    if sqlerrm <> 'Premiacao exige resultado concluido da subchave' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: awards before result'; end if;

  perform public.start_category_bracket(bracket);
  winner_entry := pg_temp.entry_at(bracket, 1);
  perform public.record_bracket_match_outcome(match_id, winner_entry, 'concluido');

  payload := public.get_event_group_checklists(event);
  if payload #>> '{groups,0,resultStatus}' <> 'registrado'
     or payload #>> '{groups,0,weighIn,status}' <> 'realizada'
     or payload #>> '{groups,0,awards,status}' <> 'pendente' then
    raise exception 'FAIL: result did not unlock awards without changing weigh-in %', payload;
  end if;
  if (select winner_entry_id from public.bracket_matches where id = match_id) <> winner_entry then
    raise exception 'FAIL: checklist path changed recorded winner';
  end if;

  payload := public.confirm_bracket_group_awards(target_group);
  if payload #>> '{awards,status}' <> 'realizada'
     or payload #>> '{awards,confirmedBy}' <> owner::text
     or payload #>> '{awards,confirmedAt}' is null then
    raise exception 'FAIL: awards did not persist %', payload;
  end if;

  rejected := false;
  begin
    perform public.undo_bracket_group_weigh_in(target_group);
  exception when others then
    if sqlerrm <> 'Premiacao ja realizada; pesagem nao pode ser desfeita' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: weigh-in undone after awards'; end if;

  reset role;
  perform set_config('request.jwt.claim.sub', outsider::text, true);
  set local role authenticated;
  rejected := false;
  begin
    perform public.confirm_bracket_group_weigh_in(target_group);
  exception when others then
    if sqlerrm <> 'Sem permissao para operar chaves' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: outsider changed weigh-in'; end if;
  if exists (select 1 from public.bracket_group_operations where group_id = target_group and weigh_in_confirmed_by = outsider) then
    raise exception 'FAIL: outsider wrote checklist via RLS';
  end if;

  reset role;
  set local role anon;
  rejected := false;
  begin
    perform public.confirm_bracket_group_awards(target_group);
  exception when others then
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: anon executed awards rpc'; end if;
  begin
    if exists (select 1 from public.bracket_group_operations where group_id = target_group) then
      raise exception 'FAIL: anon selected checklist table';
    end if;
  exception when insufficient_privilege then
    null;
  end;

  reset role;
  perform set_config('request.jwt.claim.sub', owner::text, true);
  set local role authenticated;

  perform public.undo_bracket_group_awards(target_group);
  perform public.undo_bracket_group_weigh_in(target_group);
  payload := public.get_event_group_checklists(event);
  if payload #>> '{groups,0,weighIn,status}' <> 'pendente'
     or payload #>> '{groups,0,awards,status}' <> 'pendente'
     or payload #>> '{groups,0,resultStatus}' <> 'registrado' then
    raise exception 'FAIL: undo did not restore pending checklist without touching result %', payload;
  end if;
  if (select winner_entry_id from public.bracket_matches where id = match_id) <> winner_entry then
    raise exception 'FAIL: undo changed recorded result';
  end if;

  rejected := false;
  begin
    update public.bracket_group_operations
       set weigh_in_confirmed_at = now()
     where group_id = target_group;
  exception when others then
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: direct checklist update accepted'; end if;

  if not exists (
    select 1 from public.event_audit_logs
     where event_id = event and action = 'group_weigh_in_confirmed'
  ) or not exists (
    select 1 from public.event_audit_logs
     where event_id = event and action = 'group_awards_confirmed'
  ) or not exists (
    select 1 from public.event_audit_logs
     where event_id = event and action = 'group_weigh_in_undone'
  ) or not exists (
    select 1 from public.event_audit_logs
     where event_id = event and action = 'group_awards_undone'
  ) then
    raise exception 'FAIL: checklist audit trail incomplete';
  end if;
end;
$$;

rollback;
