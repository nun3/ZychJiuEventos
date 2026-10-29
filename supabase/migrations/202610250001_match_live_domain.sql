-- MEU CAMP LIVE — Lote 1 (hardened)
-- Dominio de sessao ao vivo ancorado em bracket_matches.
-- Sem UI, sem Realtime/publication, sem ponte com record_bracket_match_outcome,
-- sem Asaas/financeiro.
--
-- Secao A (staff membership enablement) e independente do dominio LIVE e pode
-- ser revertida isoladamente se necessario.
begin;

-- ---------------------------------------------------------------------------
-- A) Staff membership enablement (sem permissao financeira)
-- ---------------------------------------------------------------------------
create or replace function public.add_organization_member(
  target_organization_id uuid,
  member_email text,
  member_role public.organization_role
)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  actor uuid := auth.uid();
  clean_email text := lower(trim(member_email));
  member_id uuid;
begin
  if actor is null then
    raise exception 'Autenticacao obrigatoria';
  end if;
  if not exists (select 1 from public.organizations org where org.id = target_organization_id) then
    raise exception 'Organizacao inexistente';
  end if;
  if not exists (
    select 1
      from public.organization_members membership
     where membership.organization_id = target_organization_id
       and membership.user_id = actor
       and membership.role = 'owner'
  ) then
    raise exception 'Acesso negado';
  end if;
  if member_role not in ('organizer', 'finance', 'staff') then
    raise exception 'Papel nao permitido para inclusao pelo owner.';
  end if;
  if clean_email is null or position('@' in clean_email) < 2 then
    raise exception 'Informe um e-mail valido';
  end if;

  select auth_user.id
    into member_id
    from auth.users auth_user
   where lower(auth_user.email) = clean_email
   limit 1;

  if member_id is null or not exists (select 1 from public.profiles profile where profile.id = member_id) then
    raise exception 'O usuario precisa criar uma conta antes de ser associado a organizacao.';
  end if;

  if exists (
    select 1
      from public.organization_members membership
     where membership.organization_id = target_organization_id
       and membership.user_id = member_id
  ) then
    raise exception 'Usuario ja e membro desta organizacao.';
  end if;

  insert into public.organization_members(organization_id, user_id, role)
    values (target_organization_id, member_id, member_role);
end;
$fn$;

comment on function public.add_organization_member(uuid, text, public.organization_role) is
  'Owner adiciona organizer, finance ou staff ja cadastrado na propria organizacao. Staff nao recebe permissao financeira.';

revoke all on function public.add_organization_member(uuid, text, public.organization_role) from public;
revoke all on function public.add_organization_member(uuid, text, public.organization_role) from anon;
grant execute on function public.add_organization_member(uuid, text, public.organization_role) to authenticated;

-- ---------------------------------------------------------------------------
-- B) LIVE domain — enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.match_live_status as enum (
    'scheduled', 'called', 'on_mat', 'running', 'paused', 'finished', 'confirmed'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.match_live_event_type as enum (
    'create_session', 'call', 'on_mat', 'start', 'pause', 'resume',
    'score', 'advantage', 'penalty', 'undo', 'finish', 'reopen', 'confirm'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.match_live_side as enum ('a', 'b');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.match_live_result_type as enum (
    'points', 'submission', 'disqualification', 'walkover', 'referee_decision', 'other'
  );
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- 2) Tabelas
-- ---------------------------------------------------------------------------
create table if not exists public.match_live_sessions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  match_id uuid not null references public.bracket_matches(id) on delete restrict,
  area_id uuid references public.event_areas(id) on delete set null,
  status public.match_live_status not null default 'scheduled',
  ruleset_snapshot jsonb not null,
  duration_seconds integer not null check (duration_seconds > 0 and duration_seconds <= 1200),
  started_at timestamptz,
  paused_at timestamptz,
  accumulated_pause_ms bigint not null default 0 check (accumulated_pause_ms >= 0),
  finished_at timestamptz,
  confirmed_at timestamptz,
  confirmed_by uuid references public.profiles(id) on delete set null,
  winner_side public.match_live_side,
  result_type public.match_live_result_type,
  score_a integer not null default 0 check (score_a >= 0),
  score_b integer not null default 0 check (score_b >= 0),
  advantages_a integer not null default 0 check (advantages_a >= 0),
  advantages_b integer not null default 0 check (advantages_b >= 0),
  penalties_a integer not null default 0 check (penalties_a >= 0),
  penalties_b integer not null default 0 check (penalties_b >= 0),
  version integer not null default 1 check (version >= 1),
  last_event_sequence integer not null default 0 check (last_event_sequence >= 0),
  operator_id uuid references public.profiles(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint match_live_sessions_match_unique unique (match_id),
  constraint match_live_sessions_ruleset_shape_chk check (
    jsonb_typeof(ruleset_snapshot) = 'object'
    and ruleset_snapshot ? 'sport'
    and ruleset_snapshot ? 'version'
    and ruleset_snapshot ? 'duration_seconds'
  ),
  constraint match_live_sessions_running_chk check (
    status <> 'running'
    or (started_at is not null and paused_at is null and finished_at is null and confirmed_at is null)
  ),
  constraint match_live_sessions_paused_chk check (
    status <> 'paused'
    or (started_at is not null and paused_at is not null and finished_at is null and confirmed_at is null)
  ),
  constraint match_live_sessions_finished_chk check (
    status <> 'finished'
    or (
      started_at is not null
      and finished_at is not null
      and confirmed_at is null
      and winner_side is not null
      and result_type is not null
    )
  ),
  constraint match_live_sessions_confirmed_chk check (
    status <> 'confirmed'
    or (
      started_at is not null
      and finished_at is not null
      and confirmed_at is not null
      and confirmed_by is not null
      and winner_side is not null
      and result_type is not null
    )
  )
);

create table if not exists public.match_live_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.match_live_sessions(id) on delete restrict,
  event_id uuid not null references public.events(id) on delete cascade,
  match_id uuid not null references public.bracket_matches(id) on delete restrict,
  sequence integer not null check (sequence >= 1),
  type public.match_live_event_type not null,
  competitor_side public.match_live_side,
  value integer,
  target_event_id uuid references public.match_live_events(id) on delete restrict,
  idempotency_key text not null check (char_length(trim(idempotency_key)) between 8 and 128),
  actor_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint match_live_events_session_sequence_unique unique (session_id, sequence),
  constraint match_live_events_session_idempotency_unique unique (session_id, idempotency_key),
  constraint match_live_events_score_value_chk check (
    type <> 'score' or value in (2, 3, 4)
  ),
  constraint match_live_events_side_required_chk check (
    type not in ('score', 'advantage', 'penalty')
    or competitor_side is not null
  ),
  constraint match_live_events_undo_target_chk check (
    (type = 'undo' and target_event_id is not null)
    or (type <> 'undo' and target_event_id is null)
  )
);

create index if not exists match_live_sessions_event_status_idx
  on public.match_live_sessions (event_id, status);
create index if not exists match_live_sessions_event_area_idx
  on public.match_live_sessions (event_id, area_id);
create index if not exists match_live_events_session_created_idx
  on public.match_live_events (session_id, created_at);
create index if not exists match_live_events_event_idx
  on public.match_live_events (event_id, created_at desc);

comment on table public.match_live_sessions is
  'Projecao corrente da luta LIVE. Ancorada em bracket_matches; confirmed e terminal no MVP.';
comment on table public.match_live_events is
  'Historico append-only de acoes LIVE. Nao expor bruto ao publico.';

-- ---------------------------------------------------------------------------
-- 3) RLS
-- ---------------------------------------------------------------------------
alter table public.match_live_sessions enable row level security;
alter table public.match_live_events enable row level security;

revoke all on table public.match_live_sessions from public, anon, authenticated;
revoke all on table public.match_live_events from public, anon, authenticated;

grant select on table public.match_live_sessions to authenticated;
grant select on table public.match_live_events to authenticated;

drop policy if exists match_live_sessions_operator_select on public.match_live_sessions;
create policy match_live_sessions_operator_select on public.match_live_sessions
for select to authenticated
using (
  public.is_platform_admin()
  or exists (
    select 1
      from public.events event_row
     where event_row.id = match_live_sessions.event_id
       and public.has_organization_role(
         event_row.organization_id,
         array['owner', 'organizer', 'staff']::public.organization_role[]
       )
  )
);

drop policy if exists match_live_events_operator_select on public.match_live_events;
create policy match_live_events_operator_select on public.match_live_events
for select to authenticated
using (
  public.is_platform_admin()
  or exists (
    select 1
      from public.events event_row
     where event_row.id = match_live_events.event_id
       and public.has_organization_role(
         event_row.organization_id,
         array['owner', 'organizer', 'staff']::public.organization_role[]
       )
  )
);

-- Escrita somente via RPC SECURITY DEFINER. Sem policies de insert/update/delete.

-- View interna de campos publicos. Sem GRANT a anon/authenticated.
-- Contrato publico oficial: get_public_event_live (RPC). Views nao herdam RLS.
create or replace view public.match_live_public_scoreboards
with (security_invoker = false)
as
select
  session.id,
  session.event_id,
  session.match_id,
  session.area_id,
  session.status,
  session.duration_seconds,
  session.started_at,
  session.paused_at,
  session.accumulated_pause_ms,
  session.finished_at,
  session.winner_side,
  session.result_type,
  session.score_a,
  session.score_b,
  session.advantages_a,
  session.advantages_b,
  session.penalties_a,
  session.penalties_b,
  session.version,
  session.updated_at
from public.match_live_sessions session
join public.events event_row on event_row.id = session.event_id
where event_row.status in ('chaves', 'em_andamento', 'concluido');

revoke all on table public.match_live_public_scoreboards from public, anon, authenticated;

comment on view public.match_live_public_scoreboards is
  'Projecao interna de campos publicos. Sem SELECT direto para anon; usar get_public_event_live.';

-- ---------------------------------------------------------------------------
-- 4) Helpers de autorizacao e lifecycle
-- ---------------------------------------------------------------------------
create or replace function public.match_live_require_operator(target_event public.events)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  actor uuid := auth.uid();
begin
  if actor is null then raise exception 'Sessao obrigatoria'; end if;
  if public.is_platform_admin() then return; end if;
  if not public.has_organization_role(
    target_event.organization_id,
    array['owner', 'organizer', 'staff']::public.organization_role[]
  ) then
    raise exception 'Sem permissao para operar LIVE';
  end if;
end;
$fn$;

create or replace function public.match_live_require_manager(target_event public.events)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  actor uuid := auth.uid();
begin
  if actor is null then raise exception 'Sessao obrigatoria'; end if;
  if public.is_platform_admin() then return; end if;
  if not public.has_organization_role(
    target_event.organization_id,
    array['owner', 'organizer']::public.organization_role[]
  ) then
    raise exception 'Sem permissao gerencial LIVE';
  end if;
end;
$fn$;

create or replace function public.match_live_lock_session(target_session_id uuid)
returns public.match_live_sessions
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  session_row public.match_live_sessions%rowtype;
begin
  select * into session_row
    from public.match_live_sessions
   where id = target_session_id
   for update;
  if not found then raise exception 'Sessao LIVE inexistente'; end if;
  return session_row;
end;
$fn$;

create or replace function public.match_live_assert_transition(
  current_status public.match_live_status,
  action_type public.match_live_event_type
)
returns public.match_live_status
language plpgsql
immutable
set search_path = ''
as $fn$
begin
  if current_status = 'confirmed' then
    raise exception 'Resultado LIVE confirmado e terminal';
  end if;

  if action_type = 'call' and current_status = 'scheduled' then return 'called'; end if;
  if action_type = 'on_mat' and current_status = 'called' then return 'on_mat'; end if;
  if action_type = 'start' and current_status = 'on_mat' then return 'running'; end if;
  if action_type = 'pause' and current_status = 'running' then return 'paused'; end if;
  if action_type = 'resume' and current_status = 'paused' then return 'running'; end if;
  if action_type in ('score', 'advantage', 'penalty') and current_status = 'running' then return current_status; end if;
  if action_type = 'undo' and current_status in ('running', 'paused') then return current_status; end if;
  if action_type = 'finish' and current_status in ('running', 'paused') then return 'finished'; end if;
  if action_type = 'reopen' and current_status = 'finished' then return 'paused'; end if;
  if action_type = 'confirm' and current_status = 'finished' then return 'confirmed'; end if;

  raise exception 'Transicao LIVE invalida: % -> %', current_status, action_type;
end;
$fn$;

create or replace function public.match_live_assert_idempotent_replay(
  existing_type public.match_live_event_type,
  existing_side public.match_live_side,
  existing_value integer,
  existing_target uuid,
  action_type public.match_live_event_type,
  competitor_side public.match_live_side,
  action_value integer,
  target_event_id uuid
)
returns void
language plpgsql
immutable
set search_path = ''
as $fn$
begin
  if existing_type is distinct from action_type
     or existing_side is distinct from competitor_side
     or existing_value is distinct from action_value
     or existing_target is distinct from target_event_id then
    raise exception 'Idempotency key reutilizada com comando diferente';
  end if;
end;
$fn$;

create or replace function public.match_live_session_to_json(session_row public.match_live_sessions)
returns jsonb
language plpgsql
stable
set search_path = ''
as $fn$
begin
  return jsonb_build_object(
    'id', session_row.id,
    'eventId', session_row.event_id,
    'matchId', session_row.match_id,
    'areaId', session_row.area_id,
    'status', session_row.status,
    'rulesetSnapshot', session_row.ruleset_snapshot,
    'durationSeconds', session_row.duration_seconds,
    'startedAt', session_row.started_at,
    'pausedAt', session_row.paused_at,
    'accumulatedPauseMs', session_row.accumulated_pause_ms,
    'finishedAt', session_row.finished_at,
    'confirmedAt', session_row.confirmed_at,
    'winnerSide', session_row.winner_side,
    'resultType', session_row.result_type,
    'scoreA', session_row.score_a,
    'scoreB', session_row.score_b,
    'advantagesA', session_row.advantages_a,
    'advantagesB', session_row.advantages_b,
    'penaltiesA', session_row.penalties_a,
    'penaltiesB', session_row.penalties_b,
    'version', session_row.version,
    'lastEventSequence', session_row.last_event_sequence,
    'operatorId', session_row.operator_id,
    'updatedAt', session_row.updated_at
  );
end;
$fn$;

create or replace function public.match_live_public_session_to_json(session_row public.match_live_sessions)
returns jsonb
language plpgsql
stable
set search_path = ''
as $fn$
begin
  return jsonb_build_object(
    'id', session_row.id,
    'eventId', session_row.event_id,
    'matchId', session_row.match_id,
    'areaId', session_row.area_id,
    'status', session_row.status,
    'durationSeconds', session_row.duration_seconds,
    'startedAt', session_row.started_at,
    'pausedAt', session_row.paused_at,
    'accumulatedPauseMs', session_row.accumulated_pause_ms,
    'finishedAt', session_row.finished_at,
    'winnerSide', session_row.winner_side,
    'resultType', session_row.result_type,
    'scoreA', session_row.score_a,
    'scoreB', session_row.score_b,
    'advantagesA', session_row.advantages_a,
    'advantagesB', session_row.advantages_b,
    'penaltiesA', session_row.penalties_a,
    'penaltiesB', session_row.penalties_b,
    'version', session_row.version,
    'updatedAt', session_row.updated_at
  );
end;
$fn$;

-- ---------------------------------------------------------------------------
-- 5) RPCs
-- ---------------------------------------------------------------------------
create or replace function public.create_match_live_session(
  target_match_id uuid,
  target_area_id uuid,
  idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  actor uuid := auth.uid();
  match_row public.bracket_matches%rowtype;
  group_row public.bracket_groups%rowtype;
  bracket_row public.category_brackets%rowtype;
  target_event public.events%rowtype;
  category_duration numeric(4,2);
  duration_seconds integer;
  session_row public.match_live_sessions%rowtype;
  existing_event public.match_live_events%rowtype;
  clean_key text := trim(idempotency_key);
  ruleset jsonb;
  next_sequence integer;
  inserted_event_id uuid;
begin
  if actor is null then raise exception 'Sessao obrigatoria'; end if;
  if target_match_id is null then raise exception 'Confronto obrigatorio'; end if;
  if clean_key is null or char_length(clean_key) < 8 or char_length(clean_key) > 128 then
    raise exception 'Idempotency key invalida';
  end if;

  select * into match_row from public.bracket_matches where id = target_match_id for update;
  if not found then raise exception 'Confronto inexistente'; end if;

  select * into group_row from public.bracket_groups where id = match_row.group_id;
  select * into bracket_row from public.category_brackets where id = group_row.bracket_id for update;
  select * into target_event from public.events where id = bracket_row.event_id for update;
  perform public.match_live_require_operator(target_event);

  if target_event.status <> 'em_andamento' then
    raise exception 'Evento fora de operacao LIVE';
  end if;
  if bracket_row.status <> 'em_andamento' then
    raise exception 'Chave fora de operacao LIVE';
  end if;
  if match_row.status <> 'pendente' then
    raise exception 'Confronto ja possui resultado na chave';
  end if;

  -- Integridade: o confronto determina o evento; area deve pertencer ao mesmo evento.
  if bracket_row.event_id is distinct from target_event.id then
    raise exception 'Confronto nao pertence ao evento';
  end if;

  if target_area_id is not null then
    if not exists (
      select 1
        from public.event_areas area
        join public.event_schedules schedule on schedule.id = area.schedule_id
       where area.id = target_area_id
         and schedule.event_id = target_event.id
         and area.active
    ) then
      raise exception 'Area nao pertence ao evento';
    end if;
  end if;

  if exists (select 1 from public.match_live_sessions existing where existing.match_id = target_match_id) then
    select session.* into session_row
      from public.match_live_sessions session
     where session.match_id = target_match_id
     for update;
    select event_row.* into existing_event
      from public.match_live_events event_row
     where event_row.session_id = session_row.id
       and event_row.idempotency_key = clean_key;
    if found then
      perform public.match_live_assert_idempotent_replay(
        existing_event.type, existing_event.competitor_side, existing_event.value, existing_event.target_event_id,
        'create_session', null, null, null
      );
      return public.match_live_session_to_json(session_row) || jsonb_build_object(
        'duplicate', true,
        'lastEventId', existing_event.id
      );
    end if;
    raise exception 'Sessao LIVE ja existe para este confronto';
  end if;

  select category.fight_duration_minutes
    into category_duration
    from public.event_categories category
   where category.id = bracket_row.category_id;
  if category_duration is null then
    raise exception 'Categoria sem duracao oficial configurada';
  end if;
  duration_seconds := round(category_duration * 60)::integer;
  if duration_seconds < 30 or duration_seconds > 1200 then
    raise exception 'Duracao oficial fora do intervalo permitido';
  end if;

  ruleset := jsonb_build_object(
    'sport', 'jiu_jitsu',
    'version', 1,
    'duration_seconds', duration_seconds,
    'scores', jsonb_build_array(2, 3, 4),
    'advantages', true,
    'penalties', true
  );

  begin
    insert into public.match_live_sessions (
      event_id, match_id, area_id, status, ruleset_snapshot, duration_seconds,
      version, last_event_sequence, operator_id, created_by
    ) values (
      target_event.id, match_row.id, target_area_id, 'scheduled', ruleset, duration_seconds,
      1, 1, actor, actor
    ) returning * into session_row;
  exception when unique_violation then
    select session.* into session_row
      from public.match_live_sessions session
     where session.match_id = match_row.id
     for update;
    if not found then raise exception 'Sessao LIVE ja existe para este confronto'; end if;
    select event_row.* into existing_event
      from public.match_live_events event_row
     where event_row.session_id = session_row.id
       and event_row.idempotency_key = clean_key;
    if found then
      perform public.match_live_assert_idempotent_replay(
        existing_event.type, existing_event.competitor_side, existing_event.value, existing_event.target_event_id,
        'create_session', null, null, null
      );
      return public.match_live_session_to_json(session_row) || jsonb_build_object(
        'duplicate', true,
        'lastEventId', existing_event.id
      );
    end if;
    raise exception 'Sessao LIVE ja existe para este confronto';
  end;

  next_sequence := 1;
  insert into public.match_live_events (
    session_id, event_id, match_id, sequence, type, idempotency_key, actor_id, metadata
  ) values (
    session_row.id, target_event.id, match_row.id, next_sequence, 'create_session', clean_key, actor,
    jsonb_build_object('areaId', target_area_id, 'durationSeconds', duration_seconds)
  ) returning id into inserted_event_id;

  insert into public.event_audit_logs (
    organization_id, event_id, actor_id, action, resource_type, resource_id, after_data
  ) values (
    target_event.organization_id, target_event.id, actor,
    'match_live_session_created', 'match_live_session', session_row.id,
    jsonb_build_object('matchId', match_row.id, 'sessionId', session_row.id, 'durationSeconds', duration_seconds)
  );

  return public.match_live_session_to_json(session_row) || jsonb_build_object(
    'duplicate', false,
    'lastEventId', inserted_event_id
  );
end;
$fn$;

create or replace function public.apply_match_live_action(
  target_session_id uuid,
  expected_version integer,
  action_type public.match_live_event_type,
  idempotency_key text,
  competitor_side public.match_live_side default null,
  action_value integer default null,
  target_event_id uuid default null,
  winner_side public.match_live_side default null,
  result_type public.match_live_result_type default null,
  action_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  actor uuid := auth.uid();
  session_row public.match_live_sessions%rowtype;
  target_event public.events%rowtype;
  existing_event public.match_live_events%rowtype;
  target_action public.match_live_events%rowtype;
  clean_key text := trim(idempotency_key);
  next_status public.match_live_status;
  next_sequence integer;
  inserted_event_id uuid;
  now_ts timestamptz := now();
  pause_delta bigint;
begin
  if actor is null then raise exception 'Sessao obrigatoria'; end if;
  if target_session_id is null then raise exception 'Sessao LIVE obrigatoria'; end if;
  if expected_version is null or expected_version < 1 then raise exception 'Versao obrigatoria'; end if;
  if action_type is null or action_type = 'create_session' then raise exception 'Acao LIVE invalida'; end if;
  if clean_key is null or char_length(clean_key) < 8 or char_length(clean_key) > 128 then
    raise exception 'Idempotency key invalida';
  end if;

  -- Ordem: auth → lock → idempotency (antes de version) → lifecycle → mutate.
  session_row := public.match_live_lock_session(target_session_id);
  select * into target_event from public.events where id = session_row.event_id for update;

  if action_type = 'confirm' then
    perform public.match_live_require_manager(target_event);
  else
    perform public.match_live_require_operator(target_event);
  end if;

  select event_row.* into existing_event
    from public.match_live_events event_row
   where event_row.session_id = session_row.id
     and event_row.idempotency_key = clean_key;
  if found then
    perform public.match_live_assert_idempotent_replay(
      existing_event.type, existing_event.competitor_side, existing_event.value, existing_event.target_event_id,
      action_type, competitor_side, action_value, target_event_id
    );
    return public.match_live_session_to_json(session_row) || jsonb_build_object(
      'duplicate', true,
      'lastEventId', existing_event.id
    );
  end if;

  if session_row.version <> expected_version then
    raise exception 'Conflito de versao LIVE';
  end if;

  next_status := public.match_live_assert_transition(session_row.status, action_type);

  if action_type in ('score', 'advantage', 'penalty') then
    if competitor_side is null then raise exception 'Lado obrigatorio'; end if;
    if action_type = 'score' and action_value not in (2, 3, 4) then
      raise exception 'Pontuacao LIVE invalida';
    end if;
  end if;

  if action_type = 'undo' then
    if target_event_id is null then raise exception 'Alvo do undo obrigatorio'; end if;
    select * into target_action
      from public.match_live_events
     where id = target_event_id
     for update;
    if not found then raise exception 'Evento alvo inexistente'; end if;
    if target_action.session_id is distinct from session_row.id then
      raise exception 'Alvo do undo fora da sessao';
    end if;
    if target_action.type = 'undo' then
      raise exception 'Nao e permitido desfazer um undo';
    end if;
    if target_action.type not in ('score', 'advantage', 'penalty') then
      raise exception 'Somente pontuacao pode ser desfeita';
    end if;
    if exists (
      select 1 from public.match_live_events undo_event
       where undo_event.session_id = session_row.id
         and undo_event.type = 'undo'
         and undo_event.target_event_id = target_action.id
    ) then
      raise exception 'Acao ja desfeita';
    end if;
  end if;

  if action_type = 'finish' then
    if winner_side is null or result_type is null then
      raise exception 'Resultado da luta incompleto';
    end if;
  end if;

  -- Clock oficial usa now() do banco.
  if action_type = 'start' then
    session_row.started_at := now_ts;
    session_row.paused_at := null;
  elsif action_type = 'pause' then
    session_row.paused_at := now_ts;
  elsif action_type = 'resume' then
    if session_row.paused_at is null then raise exception 'Luta nao esta pausada'; end if;
    pause_delta := greatest(0, floor(extract(epoch from (now_ts - session_row.paused_at)) * 1000)::bigint);
    session_row.accumulated_pause_ms := session_row.accumulated_pause_ms + pause_delta;
    session_row.paused_at := null;
  elsif action_type = 'finish' then
    if session_row.status = 'paused' and session_row.paused_at is not null then
      pause_delta := greatest(0, floor(extract(epoch from (now_ts - session_row.paused_at)) * 1000)::bigint);
      session_row.accumulated_pause_ms := session_row.accumulated_pause_ms + pause_delta;
    end if;
    session_row.paused_at := coalesce(session_row.paused_at, now_ts);
    session_row.finished_at := now_ts;
    session_row.winner_side := winner_side;
    session_row.result_type := result_type;
  elsif action_type = 'reopen' then
    session_row.finished_at := null;
    session_row.winner_side := null;
    session_row.result_type := null;
    session_row.paused_at := now_ts;
  elsif action_type = 'confirm' then
    session_row.confirmed_at := now_ts;
    session_row.confirmed_by := actor;
  end if;

  if action_type = 'score' then
    if competitor_side = 'a' then session_row.score_a := session_row.score_a + action_value;
    else session_row.score_b := session_row.score_b + action_value;
    end if;
  elsif action_type = 'advantage' then
    if competitor_side = 'a' then session_row.advantages_a := session_row.advantages_a + 1;
    else session_row.advantages_b := session_row.advantages_b + 1;
    end if;
  elsif action_type = 'penalty' then
    if competitor_side = 'a' then session_row.penalties_a := session_row.penalties_a + 1;
    else session_row.penalties_b := session_row.penalties_b + 1;
    end if;
  elsif action_type = 'undo' then
    if target_action.type = 'score' then
      if target_action.competitor_side = 'a' then
        session_row.score_a := greatest(0, session_row.score_a - coalesce(target_action.value, 0));
      else
        session_row.score_b := greatest(0, session_row.score_b - coalesce(target_action.value, 0));
      end if;
    elsif target_action.type = 'advantage' then
      if target_action.competitor_side = 'a' then
        session_row.advantages_a := greatest(0, session_row.advantages_a - 1);
      else
        session_row.advantages_b := greatest(0, session_row.advantages_b - 1);
      end if;
    elsif target_action.type = 'penalty' then
      if target_action.competitor_side = 'a' then
        session_row.penalties_a := greatest(0, session_row.penalties_a - 1);
      else
        session_row.penalties_b := greatest(0, session_row.penalties_b - 1);
      end if;
    end if;
  end if;

  next_sequence := session_row.last_event_sequence + 1;

  insert into public.match_live_events (
    session_id, event_id, match_id, sequence, type, competitor_side, value,
    target_event_id, idempotency_key, actor_id, metadata
  ) values (
    session_row.id, session_row.event_id, session_row.match_id, next_sequence, action_type,
    competitor_side, action_value, target_event_id, clean_key, actor,
    coalesce(action_metadata, '{}'::jsonb)
  ) returning id into inserted_event_id;

  update public.match_live_sessions
     set status = next_status,
         started_at = session_row.started_at,
         paused_at = session_row.paused_at,
         accumulated_pause_ms = session_row.accumulated_pause_ms,
         finished_at = session_row.finished_at,
         confirmed_at = session_row.confirmed_at,
         confirmed_by = session_row.confirmed_by,
         winner_side = session_row.winner_side,
         result_type = session_row.result_type,
         score_a = session_row.score_a,
         score_b = session_row.score_b,
         advantages_a = session_row.advantages_a,
         advantages_b = session_row.advantages_b,
         penalties_a = session_row.penalties_a,
         penalties_b = session_row.penalties_b,
         version = session_row.version + 1,
         last_event_sequence = next_sequence,
         operator_id = actor,
         updated_at = now_ts
   where id = session_row.id
   returning * into session_row;

  if action_type in ('finish', 'reopen', 'confirm') then
    insert into public.event_audit_logs (
      organization_id, event_id, actor_id, action, resource_type, resource_id, after_data
    ) values (
      target_event.organization_id, target_event.id, actor,
      case action_type
        when 'finish' then 'match_live_finished'
        when 'reopen' then 'match_live_reopened'
        else 'match_live_confirmed'
      end,
      'match_live_session', session_row.id,
      jsonb_build_object(
        'matchId', session_row.match_id,
        'status', session_row.status,
        'winnerSide', session_row.winner_side,
        'resultType', session_row.result_type,
        'version', session_row.version
      )
    );
  end if;

  return public.match_live_session_to_json(session_row) || jsonb_build_object(
    'duplicate', false,
    'lastEventId', inserted_event_id
  );
end;
$fn$;

create or replace function public.get_match_live_session(target_session_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  session_row public.match_live_sessions%rowtype;
  target_event public.events%rowtype;
begin
  if auth.uid() is null then raise exception 'Sessao obrigatoria'; end if;
  select * into session_row from public.match_live_sessions where id = target_session_id;
  if not found then raise exception 'Sessao LIVE inexistente'; end if;
  select * into target_event from public.events where id = session_row.event_id;
  perform public.match_live_require_operator(target_event);
  return public.match_live_session_to_json(session_row);
end;
$fn$;

create or replace function public.list_event_live_sessions(target_event_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  target_event public.events%rowtype;
  payload jsonb;
begin
  if auth.uid() is null then raise exception 'Sessao obrigatoria'; end if;
  select * into target_event from public.events where id = target_event_id;
  if not found then raise exception 'Evento inexistente'; end if;
  perform public.match_live_require_operator(target_event);

  select coalesce(jsonb_agg(public.match_live_session_to_json(session) order by session.updated_at desc), '[]'::jsonb)
    into payload
    from public.match_live_sessions session
   where session.event_id = target_event_id;

  return jsonb_build_object('kind', 'event_live_sessions', 'sessions', payload);
end;
$fn$;

create or replace function public.get_public_event_live(target_event_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  payload jsonb;
begin
  if target_event_id is null or not exists (
    select 1 from public.events event_row
     where event_row.id = target_event_id
       and event_row.status in ('chaves', 'em_andamento', 'concluido')
  ) then
    return jsonb_build_object('kind', 'public_live', 'sessions', '[]'::jsonb);
  end if;

  select coalesce(jsonb_agg(public.match_live_public_session_to_json(session) order by session.updated_at desc), '[]'::jsonb)
    into payload
    from public.match_live_sessions session
   where session.event_id = target_event_id;

  return jsonb_build_object('kind', 'public_live', 'sessions', payload);
end;
$fn$;

-- ---------------------------------------------------------------------------
-- C) Grants — sem Realtime/publication neste lote
-- ---------------------------------------------------------------------------
revoke all on function public.match_live_require_operator(public.events) from public;
revoke all on function public.match_live_require_operator(public.events) from anon, authenticated;
revoke all on function public.match_live_require_manager(public.events) from public;
revoke all on function public.match_live_require_manager(public.events) from anon, authenticated;
revoke all on function public.match_live_lock_session(uuid) from public;
revoke all on function public.match_live_lock_session(uuid) from anon, authenticated;
revoke all on function public.match_live_assert_transition(public.match_live_status, public.match_live_event_type) from public;
revoke all on function public.match_live_assert_transition(public.match_live_status, public.match_live_event_type) from anon, authenticated;
revoke all on function public.match_live_assert_idempotent_replay(public.match_live_event_type, public.match_live_side, integer, uuid, public.match_live_event_type, public.match_live_side, integer, uuid) from public;
revoke all on function public.match_live_assert_idempotent_replay(public.match_live_event_type, public.match_live_side, integer, uuid, public.match_live_event_type, public.match_live_side, integer, uuid) from anon, authenticated;
revoke all on function public.match_live_session_to_json(public.match_live_sessions) from public;
revoke all on function public.match_live_session_to_json(public.match_live_sessions) from anon, authenticated;
revoke all on function public.match_live_public_session_to_json(public.match_live_sessions) from public;
revoke all on function public.match_live_public_session_to_json(public.match_live_sessions) from anon, authenticated;

revoke all on function public.create_match_live_session(uuid, uuid, text) from public;
revoke all on function public.create_match_live_session(uuid, uuid, text) from anon;
revoke all on function public.apply_match_live_action(
  uuid, integer, public.match_live_event_type, text, public.match_live_side, integer, uuid,
  public.match_live_side, public.match_live_result_type, jsonb
) from public;
revoke all on function public.apply_match_live_action(
  uuid, integer, public.match_live_event_type, text, public.match_live_side, integer, uuid,
  public.match_live_side, public.match_live_result_type, jsonb
) from anon;
revoke all on function public.get_match_live_session(uuid) from public;
revoke all on function public.get_match_live_session(uuid) from anon;
revoke all on function public.list_event_live_sessions(uuid) from public;
revoke all on function public.list_event_live_sessions(uuid) from anon;
revoke all on function public.get_public_event_live(uuid) from public;

grant execute on function public.create_match_live_session(uuid, uuid, text) to authenticated;
grant execute on function public.apply_match_live_action(
  uuid, integer, public.match_live_event_type, text, public.match_live_side, integer, uuid,
  public.match_live_side, public.match_live_result_type, jsonb
) to authenticated;
grant execute on function public.get_match_live_session(uuid) to authenticated;
grant execute on function public.list_event_live_sessions(uuid) to authenticated;
grant execute on function public.get_public_event_live(uuid) to anon, authenticated;

-- Sem alter publication supabase_realtime. Realtime entra no Lote 4 via Broadcast.

commit;
