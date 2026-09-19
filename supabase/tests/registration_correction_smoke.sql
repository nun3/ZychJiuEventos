-- Correcao auditada da inscricao. Fixtures roll back.
-- Nao altera category_change_requests alem de provar que o fluxo existente permanece.
begin;

do $$
declare
  owner uuid := gen_random_uuid();
  organizer uuid := gen_random_uuid();
  professor uuid := gen_random_uuid();
  self_user uuid := gen_random_uuid();
  outsider uuid := gen_random_uuid();
  org uuid := gen_random_uuid();
  team_one uuid := gen_random_uuid();
  team_two uuid := gen_random_uuid();
  event uuid := gen_random_uuid();
  rules uuid := gen_random_uuid();
  cat_leve uuid := gen_random_uuid();
  cat_medio uuid := gen_random_uuid();
  cat_pesado uuid := gen_random_uuid();
  athlete_self uuid := gen_random_uuid();
  athlete_managed uuid := gen_random_uuid();
  athlete_weight uuid := gen_random_uuid();
  athlete_team uuid := gen_random_uuid();
  athlete_lock uuid := gen_random_uuid();
  athlete_belt uuid := gen_random_uuid();
  reg_self uuid := gen_random_uuid();
  reg_managed uuid := gen_random_uuid();
  reg_weight uuid := gen_random_uuid();
  reg_team uuid := gen_random_uuid();
  reg_lock uuid := gen_random_uuid();
  reg_belt uuid := gen_random_uuid();
  request_nome uuid;
  request_faixa uuid;
  request_peso uuid;
  request_equipe uuid;
  request_lock uuid;
  request_belt uuid;
  category_request uuid;
  rejected boolean;
  reviewed jsonb;
  snapshot jsonb;
  leve_snapshot jsonb;
  category_count integer;
begin
  insert into auth.users(id, email, raw_user_meta_data) values
    (owner, owner::text || '@example.invalid', jsonb_build_object('nome_completo', 'Owner correcao', 'tipo_cadastro', 'organizador', 'data_nascimento', '1990-01-01')),
    (organizer, organizer::text || '@example.invalid', jsonb_build_object('nome_completo', 'Organizer correcao', 'tipo_cadastro', 'organizador', 'data_nascimento', '1990-01-01')),
    (professor, professor::text || '@example.invalid', jsonb_build_object('nome_completo', 'Professor correcao', 'tipo_cadastro', 'professor', 'data_nascimento', '1990-01-01')),
    (self_user, self_user::text || '@example.invalid', jsonb_build_object('nome_completo', 'Atleta proprio', 'tipo_cadastro', 'atleta', 'data_nascimento', '1990-01-01')),
    (outsider, outsider::text || '@example.invalid', jsonb_build_object('nome_completo', 'Terceiro', 'tipo_cadastro', 'atleta', 'data_nascimento', '1990-01-01'));
  insert into public.organizations(id, nome, slug, created_by) values (org, 'Org correcao', org::text, owner);
  insert into public.organization_members(organization_id, user_id, role) values
    (org, owner, 'owner'),
    (org, organizer, 'organizer');
  insert into public.teams(id, organization_id, nome, created_by) values
    (team_one, org, 'Equipe Um', owner),
    (team_two, org, 'Equipe Dois', owner);
  insert into public.events(id, organization_id, nome, slug, data_evento, local, status, created_by, valor_inscricao)
    values (event, org, 'Evento correcao', event::text, current_date, 'Teste', 'checagem', owner, 80);
  insert into public.category_rule_sets(id, event_id, nome, versao, ativo) values (rules, event, 'Regras', 1, true);
  insert into public.event_categories(
    id, rule_set_id, nome, idade_min, idade_max, faixa_min_ordem, faixa_max_ordem, peso_min_kg, peso_max_kg, genero, ordem
  ) values
    (cat_leve, rules, 'Adulto Leve', 18, 29, 1, 1, 0, 76, 'M', 1),
    (cat_medio, rules, 'Adulto Medio', 18, 29, 1, 1, 76.01, 88, 'M', 2),
    (cat_pesado, rules, 'Adulto Pesado', 18, 29, 1, 1, 88.01, 100, 'M', 3);
  insert into public.athletes(id, organization_id, team_id, user_id, nome_completo, data_nascimento, genero, faixa, peso_kg)
    values
      (athlete_self, org, team_one, self_user, 'Atleta Proprio', current_date - interval '25 years', 'M', 'Branca', 70),
      (athlete_managed, org, team_one, null, 'Atleta Gerenciado', current_date - interval '25 years', 'M', 'Branca', 70),
      (athlete_weight, org, team_one, null, 'Atleta Peso', current_date - interval '25 years', 'M', 'Branca', 70),
      (athlete_team, org, team_one, null, 'Atleta Equipe', current_date - interval '25 years', 'M', 'Branca', 70),
      (athlete_lock, org, team_one, null, 'Atleta Lock', current_date - interval '25 years', 'M', 'Branca', 70),
      (athlete_belt, org, team_one, null, 'Atleta Faixa', current_date - interval '25 years', 'M', 'Branca', 70);
  insert into public.athlete_managers(manager_id, athlete_id, relationship_type) values
    (professor, athlete_managed, 'professor'),
    (professor, athlete_weight, 'professor'),
    (professor, athlete_team, 'professor'),
    (professor, athlete_lock, 'professor'),
    (professor, athlete_belt, 'professor');

  snapshot := jsonb_build_object(
    'nome_completo', 'Atleta Proprio',
    'data_nascimento', (current_date - interval '25 years')::date,
    'genero', 'M',
    'faixa', 'Branca',
    'peso_kg', 70,
    'team_id', team_one,
    'team_name', 'Equipe Um'
  );
  leve_snapshot := jsonb_build_object('nome', 'Adulto Leve');
  insert into public.registrations(
    id, event_id, athlete_id, category_id, registered_by, status, valor,
    athlete_snapshot, category_snapshot, rule_set_version, terms_version, terms_accepted_at
  ) values
    (reg_self, event, athlete_self, cat_leve, self_user, 'efetivada', 80, snapshot, jsonb_build_object('nome', 'Adulto Leve'), 1, 'MVP-2026-09', now()),
    (reg_managed, event, athlete_managed, cat_pesado, professor, 'efetivada', 80,
      snapshot || jsonb_build_object('nome_completo', 'Atleta Gerenciado'), jsonb_build_object('nome', 'Adulto Pesado'), 1, 'MVP-2026-09', now()),
    (reg_weight, event, athlete_weight, cat_medio, professor, 'efetivada', 80,
      snapshot || jsonb_build_object('nome_completo', 'Atleta Peso'), jsonb_build_object('nome', 'Adulto Medio'), 1, 'MVP-2026-09', now()),
    (reg_team, event, athlete_team, cat_pesado, professor, 'efetivada', 80,
      snapshot || jsonb_build_object('nome_completo', 'Atleta Equipe'), jsonb_build_object('nome', 'Adulto Pesado'), 1, 'MVP-2026-09', now()),
    (reg_lock, event, athlete_lock, cat_pesado, professor, 'efetivada', 80,
      snapshot || jsonb_build_object('nome_completo', 'Atleta Lock'), jsonb_build_object('nome', 'Adulto Pesado'), 1, 'MVP-2026-09', now()),
    (reg_belt, event, athlete_belt, cat_pesado, professor, 'efetivada', 80,
      snapshot || jsonb_build_object('nome_completo', 'Atleta Faixa'), jsonb_build_object('nome', 'Adulto Pesado'), 1, 'MVP-2026-09', now());

  -- Terceiro nao autorizado.
  perform set_config('request.jwt.claim.sub', outsider::text, true);
  set local role authenticated;
  rejected := false;
  begin
    perform public.request_registration_correction(reg_self, 'nome', 'Nome Invadido', null);
  exception when others then
    if sqlerrm <> 'Sem permissao para solicitar correcao' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: outsider requested'; end if;

  -- Organizer sem gestao do atleta nao solicita.
  reset role;
  perform set_config('request.jwt.claim.sub', organizer::text, true);
  set local role authenticated;
  rejected := false;
  begin
    perform public.request_registration_correction(reg_self, 'nome', 'Nome Organizer', null);
  exception when others then
    if sqlerrm <> 'Sem permissao para solicitar correcao' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: organizer requested without management'; end if;

  -- Proprio atleta solicita nome.
  reset role;
  perform set_config('request.jwt.claim.sub', self_user::text, true);
  set local role authenticated;
  request_nome := (public.request_registration_correction(reg_self, 'nome', 'Nome Corrigido', 'grafia')->>'requestId')::uuid;
  if request_nome is null then raise exception 'FAIL: self athlete request'; end if;

  -- Gestor autorizado solicita faixa, peso, equipe e pendente para lock.
  reset role;
  perform set_config('request.jwt.claim.sub', professor::text, true);
  set local role authenticated;
  request_faixa := (public.request_registration_correction(reg_managed, 'faixa', 'Azul', null)->>'requestId')::uuid;
  request_peso := (public.request_registration_correction(reg_weight, 'peso', '90', null)->>'requestId')::uuid;
  request_equipe := (public.request_registration_correction(reg_team, 'equipe', team_two::text, 'troca de academia')->>'requestId')::uuid;
  request_lock := (public.request_registration_correction(reg_lock, 'nome', 'Lock Pendente', null)->>'requestId')::uuid;
  request_belt := (public.request_registration_correction(reg_belt, 'faixa', 'Azul', null)->>'requestId')::uuid;
  if request_faixa is null or request_peso is null or request_equipe is null or request_lock is null or request_belt is null then
    raise exception 'FAIL: manager requests';
  end if;

  -- Organizer aprova nome, peso, equipe e faixa incompativel; recusa a outra faixa.
  reset role;
  perform set_config('request.jwt.claim.sub', organizer::text, true);
  set local role authenticated;

  reviewed := public.review_registration_correction(request_nome, true);
  if reviewed->>'kind' <> 'reviewed' or reviewed->>'status' <> 'aprovada' then
    raise exception 'FAIL: organizer approve name';
  end if;
  if (select athlete_snapshot->>'nome_completo' from public.registrations where id = reg_self) <> 'Nome Corrigido' then
    raise exception 'FAIL: registration name not corrected';
  end if;
  if (select nome_completo from public.athletes where id = athlete_self) <> 'Nome Corrigido' then
    raise exception 'FAIL: master athlete name not synced';
  end if;
  if (select previous_value->>'nome_completo' from public.registration_correction_requests where id = request_nome) <> 'Atleta Proprio' then
    raise exception 'FAIL: previous name not auditable';
  end if;
  if (select category_id from public.registrations where id = reg_self) is distinct from cat_leve
     or (select current_category_id from public.registrations where id = reg_self) is not null then
    raise exception 'FAIL: name approval recategorized';
  end if;

  reviewed := public.review_registration_correction(request_faixa, false);
  if reviewed->>'status' <> 'recusada' then raise exception 'FAIL: organizer reject belt'; end if;
  if (select athlete_snapshot->>'faixa' from public.registrations where id = reg_managed) <> 'Branca' then
    raise exception 'FAIL: rejected belt mutated snapshot';
  end if;
  if (select previous_value->>'faixa' from public.registration_correction_requests where id = request_faixa) <> 'Branca' then
    raise exception 'FAIL: rejected previous belt lost';
  end if;

  reviewed := public.review_registration_correction(request_peso, true);
  if reviewed->>'status' <> 'aprovada' then raise exception 'FAIL: organizer approve weight'; end if;
  if reviewed->>'categoryCompatible' <> 'false' then raise exception 'FAIL: incompatible weight not flagged'; end if;
  if (select (athlete_snapshot->>'peso_kg')::numeric from public.registrations where id = reg_weight) is distinct from 90 then
    raise exception 'FAIL: registration weight not corrected';
  end if;
  if (select peso_kg from public.athletes where id = athlete_weight) is distinct from 90 then
    raise exception 'FAIL: master weight not synced';
  end if;
  if (select category_id from public.registrations where id = reg_weight) is distinct from cat_medio
     or (select current_category_id from public.registrations where id = reg_weight) is not null then
    raise exception 'FAIL: weight correction recategorized silently';
  end if;
  if (select previous_value->>'peso_kg' from public.registration_correction_requests where id = request_peso) <> '70' then
    raise exception 'FAIL: previous weight not auditable';
  end if;

  reviewed := public.review_registration_correction(request_equipe, true);
  if reviewed->>'status' <> 'aprovada' then raise exception 'FAIL: organizer approve team'; end if;
  if (select athlete_snapshot->>'team_id' from public.registrations where id = reg_team)::uuid is distinct from team_two then
    raise exception 'FAIL: registration team not corrected';
  end if;
  if (select athlete_snapshot->>'team_name' from public.registrations where id = reg_team) <> 'Equipe Dois' then
    raise exception 'FAIL: registration team name not corrected';
  end if;
  if (select team_id from public.athletes where id = athlete_team) is distinct from team_two then
    raise exception 'FAIL: master team not synced';
  end if;
  if (select previous_value->>'team_id' from public.registration_correction_requests where id = request_equipe)::uuid is distinct from team_one then
    raise exception 'FAIL: previous team not auditable';
  end if;
  if not exists (
    select 1 from public.event_audit_logs
    where action = 'athlete.team_changed' and resource_id = athlete_team
      and before_data->>'team_id' = team_one::text
      and after_data->>'team_id' = team_two::text
  ) then raise exception 'FAIL: team change audit'; end if;

  reviewed := public.review_registration_correction(request_belt, true);
  if reviewed->>'categoryCompatible' <> 'false' then raise exception 'FAIL: incompatible belt not flagged'; end if;
  if (select athlete_snapshot->>'faixa' from public.registrations where id = reg_belt) <> 'Azul' then
    raise exception 'FAIL: registration belt not corrected';
  end if;
  if (select category_id from public.registrations where id = reg_belt) is distinct from cat_pesado
     or (select current_category_id from public.registrations where id = reg_belt) is not null then
    raise exception 'FAIL: belt correction recategorized silently';
  end if;

  -- Snapshot continua protegido fora da RPC.
  reset role;
  rejected := false;
  begin
    update public.registrations
    set athlete_snapshot = athlete_snapshot || jsonb_build_object('nome_completo', 'Hack')
    where id = reg_self;
  exception when others then
    if sqlerrm <> 'Snapshot da inscricao e imutavel' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: direct snapshot update allowed'; end if;

  if has_table_privilege('authenticated', 'public.registration_correction_requests', 'INSERT')
    or has_table_privilege('authenticated', 'public.registration_correction_requests', 'UPDATE')
    or has_table_privilege('authenticated', 'public.registration_correction_requests', 'DELETE')
  then raise exception 'FAIL: direct write allowed'; end if;

  -- Fluxo existente de categoria permanece intacto.
  reset role;
  select count(*) into category_count from public.category_change_requests;
  perform set_config('request.jwt.claim.sub', self_user::text, true);
  set local role authenticated;
  category_request := (public.request_category_change(reg_self, cat_medio, 'motivo valido')->>'requestId')::uuid;
  if category_request is null then raise exception 'FAIL: existing category request broken'; end if;
  reset role;
  if (select count(*) from public.category_change_requests) <> category_count + 1 then
    raise exception 'FAIL: category request table mutated unexpectedly';
  end if;
  if (select status from public.category_change_requests where id = category_request) <> 'pendente' then
    raise exception 'FAIL: category request status';
  end if;
  if exists (
    select 1 from public.registration_correction_requests
    where id in (request_nome, request_faixa, request_peso, request_equipe, request_belt)
      and status = 'pendente'
  ) then raise exception 'FAIL: decided correction reverted'; end if;

  -- Apos lock: pedido novo e aprovacao pendente falham. Valor antigo permanece.
  reset role;
  perform set_config('request.jwt.claim.sub', owner::text, true);
  set local role authenticated;
  if (public.lock_event_checagem(event)->>'kind') <> 'locked' then
    raise exception 'FAIL: lock';
  end if;

  reset role;
  perform set_config('request.jwt.claim.sub', professor::text, true);
  set local role authenticated;
  rejected := false;
  begin
    perform public.request_registration_correction(reg_lock, 'peso', '71', null);
  exception when others then
    if sqlerrm <> 'Checagem travada' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: request after lock'; end if;

  reset role;
  perform set_config('request.jwt.claim.sub', owner::text, true);
  set local role authenticated;
  rejected := false;
  begin
    perform public.review_registration_correction(request_lock, true);
  exception when others then
    if sqlerrm <> 'Checagem travada' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: approve after lock'; end if;
  if (select status from public.registration_correction_requests where id = request_lock) <> 'pendente' then
    raise exception 'FAIL: pending mutated after lock';
  end if;
  if (select previous_value->>'nome_completo' from public.registration_correction_requests where id = request_lock) <> 'Atleta Lock' then
    raise exception 'FAIL: pending previous value lost';
  end if;
  if (select athlete_snapshot->>'nome_completo' from public.registrations where id = reg_lock) <> 'Atleta Lock' then
    raise exception 'FAIL: lock approval leaked';
  end if;
  if (select status from public.category_change_requests where id = category_request) <> 'pendente' then
    raise exception 'FAIL: category request altered by lock path';
  end if;
end;
$$;

rollback;
