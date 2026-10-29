-- MEU CAMP LIVE — Hotfix UNDO ambiguity (PL/pgSQL)
-- Escopo: somente public.apply_match_live_action
-- Não altera 202610250001_match_live_domain.sql
-- Não habilita Realtime. Não muda assinatura/contratos/autorização/lifecycle/idempotência.
--
-- Causa raiz: em SQL embutido, o parâmetro target_event_id colide com a coluna
-- public.match_live_events.target_event_id (erro: column reference is ambiguous).
-- Colisões latentes endurecidas no INSERT: competitor_side / value / type / idempotency_key.

begin;

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
  -- Locais explícitos: evitam colisão parâmetro × coluna em SQL embutido.
  v_action_type public.match_live_event_type := action_type;
  v_competitor_side public.match_live_side := competitor_side;
  v_action_value integer := action_value;
  v_target_event_id uuid := target_event_id;
  v_winner_side public.match_live_side := winner_side;
  v_result_type public.match_live_result_type := result_type;
  v_action_metadata jsonb := coalesce(action_metadata, '{}'::jsonb);
begin
  if actor is null then raise exception 'Sessao obrigatoria'; end if;
  if target_session_id is null then raise exception 'Sessao LIVE obrigatoria'; end if;
  if expected_version is null or expected_version < 1 then raise exception 'Versao obrigatoria'; end if;
  if v_action_type is null or v_action_type = 'create_session' then raise exception 'Acao LIVE invalida'; end if;
  if clean_key is null or char_length(clean_key) < 8 or char_length(clean_key) > 128 then
    raise exception 'Idempotency key invalida';
  end if;

  -- Ordem: auth → lock → idempotency (antes de version) → lifecycle → mutate.
  session_row := public.match_live_lock_session(target_session_id);
  select * into target_event from public.events where id = session_row.event_id for update;

  if v_action_type = 'confirm' then
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
      v_action_type, v_competitor_side, v_action_value, v_target_event_id
    );
    return public.match_live_session_to_json(session_row) || jsonb_build_object(
      'duplicate', true,
      'lastEventId', existing_event.id
    );
  end if;

  if session_row.version <> expected_version then
    raise exception 'Conflito de versao LIVE';
  end if;

  next_status := public.match_live_assert_transition(session_row.status, v_action_type);

  if v_action_type in ('score', 'advantage', 'penalty') then
    if v_competitor_side is null then raise exception 'Lado obrigatorio'; end if;
    if v_action_type = 'score' and v_action_value not in (2, 3, 4) then
      raise exception 'Pontuacao LIVE invalida';
    end if;
  end if;

  if v_action_type = 'undo' then
    if v_target_event_id is null then raise exception 'Alvo do undo obrigatorio'; end if;
    select mle.* into target_action
      from public.match_live_events mle
     where mle.id = v_target_event_id
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

  if v_action_type = 'finish' then
    if v_winner_side is null or v_result_type is null then
      raise exception 'Resultado da luta incompleto';
    end if;
  end if;

  -- Clock oficial usa now() do banco.
  if v_action_type = 'start' then
    session_row.started_at := now_ts;
    session_row.paused_at := null;
  elsif v_action_type = 'pause' then
    session_row.paused_at := now_ts;
  elsif v_action_type = 'resume' then
    if session_row.paused_at is null then raise exception 'Luta nao esta pausada'; end if;
    pause_delta := greatest(0, floor(extract(epoch from (now_ts - session_row.paused_at)) * 1000)::bigint);
    session_row.accumulated_pause_ms := session_row.accumulated_pause_ms + pause_delta;
    session_row.paused_at := null;
  elsif v_action_type = 'finish' then
    if session_row.status = 'paused' and session_row.paused_at is not null then
      pause_delta := greatest(0, floor(extract(epoch from (now_ts - session_row.paused_at)) * 1000)::bigint);
      session_row.accumulated_pause_ms := session_row.accumulated_pause_ms + pause_delta;
    end if;
    session_row.paused_at := coalesce(session_row.paused_at, now_ts);
    session_row.finished_at := now_ts;
    session_row.winner_side := v_winner_side;
    session_row.result_type := v_result_type;
  elsif v_action_type = 'reopen' then
    session_row.finished_at := null;
    session_row.winner_side := null;
    session_row.result_type := null;
    session_row.paused_at := now_ts;
  elsif v_action_type = 'confirm' then
    session_row.confirmed_at := now_ts;
    session_row.confirmed_by := actor;
  end if;

  if v_action_type = 'score' then
    if v_competitor_side = 'a' then session_row.score_a := session_row.score_a + v_action_value;
    else session_row.score_b := session_row.score_b + v_action_value;
    end if;
  elsif v_action_type = 'advantage' then
    if v_competitor_side = 'a' then session_row.advantages_a := session_row.advantages_a + 1;
    else session_row.advantages_b := session_row.advantages_b + 1;
    end if;
  elsif v_action_type = 'penalty' then
    if v_competitor_side = 'a' then session_row.penalties_a := session_row.penalties_a + 1;
    else session_row.penalties_b := session_row.penalties_b + 1;
    end if;
  elsif v_action_type = 'undo' then
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
    session_row.id, session_row.event_id, session_row.match_id, next_sequence, v_action_type,
    v_competitor_side, v_action_value, v_target_event_id, clean_key, actor,
    v_action_metadata
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

  if v_action_type in ('finish', 'reopen', 'confirm') then
    insert into public.event_audit_logs (
      organization_id, event_id, actor_id, action, resource_type, resource_id, after_data
    ) values (
      target_event.organization_id, target_event.id, actor,
      case v_action_type
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

comment on function public.apply_match_live_action(
  uuid, integer, public.match_live_event_type, text, public.match_live_side, integer, uuid,
  public.match_live_side, public.match_live_result_type, jsonb
) is
  'Aplica acao LIVE com versionamento otimista e idempotencia. Hotfix 202610290001: remove ambiguidade PL/pgSQL de target_event_id no UNDO.';

-- Reafirma grants/revokes efetivos (assinatura inalterada).
revoke all on function public.apply_match_live_action(
  uuid, integer, public.match_live_event_type, text, public.match_live_side, integer, uuid,
  public.match_live_side, public.match_live_result_type, jsonb
) from public;
revoke all on function public.apply_match_live_action(
  uuid, integer, public.match_live_event_type, text, public.match_live_side, integer, uuid,
  public.match_live_side, public.match_live_result_type, jsonb
) from anon;
grant execute on function public.apply_match_live_action(
  uuid, integer, public.match_live_event_type, text, public.match_live_side, integer, uuid,
  public.match_live_side, public.match_live_result_type, jsonb
) to authenticated;

commit;
