-- Sprint 7 lote 3: travamento operacional unico da checagem.
-- Nao ha RPC de reabertura neste lote.
begin;

create or replace function public.protect_checagem_lock()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.checagem_travada_em is not distinct from old.checagem_travada_em then
    return new;
  end if;
  if old.checagem_travada_em is not null then
    if new.checagem_travada_em is null then
      raise exception 'Reabertura da checagem nao permitida';
    end if;
    raise exception 'Checagem ja travada';
  end if;
  if new.checagem_travada_em is null then
    raise exception 'Reabertura da checagem nao permitida';
  end if;
  if current_setting('jiu.allow_checagem_lock', true) is distinct from '1' then
    raise exception 'Travamento da checagem so via operacao autorizada';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_checagem_lock on public.events;
create trigger protect_checagem_lock
before update of checagem_travada_em on public.events
for each row execute function public.protect_checagem_lock();

create or replace function public.lock_event_checagem(target_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  target_event public.events%rowtype;
  locked_at timestamptz := now();
begin
  if actor is null then raise exception 'Sessao obrigatoria'; end if;
  if target_event_id is null then raise exception 'Evento obrigatorio'; end if;

  select * into target_event
  from public.events
  where id = target_event_id
  for update;
  if not found then raise exception 'Evento inexistente'; end if;

  if not public.is_platform_admin() and not exists (
    select 1 from public.organization_members member
    where member.organization_id = target_event.organization_id
      and member.user_id = actor
      and member.role in ('owner', 'organizer')
  ) then raise exception 'Sem permissao para travar checagem'; end if;

  if target_event.status <> 'checagem' then raise exception 'Evento fora da fase de checagem'; end if;
  if target_event.checagem_travada_em is not null then raise exception 'Checagem ja travada'; end if;

  perform set_config('jiu.allow_checagem_lock', '1', true);

  update public.events
  set checagem_travada_em = locked_at, updated_at = now()
  where id = target_event.id;

  insert into public.event_audit_logs (
    organization_id, event_id, actor_id, action, resource_type,
    resource_id, before_data, after_data
  ) values (
    target_event.organization_id, target_event.id, actor,
    'checagem_locked', 'event', target_event.id,
    jsonb_build_object('checagemTravadaEm', target_event.checagem_travada_em),
    jsonb_build_object('checagemTravadaEm', locked_at, 'lockedBy', actor)
  );

  return jsonb_build_object('kind', 'locked', 'eventId', target_event.id, 'lockedAt', locked_at);
end;
$$;

revoke execute on function public.protect_checagem_lock() from public, anon, authenticated;
revoke all on function public.lock_event_checagem(uuid) from public, anon;
grant execute on function public.lock_event_checagem(uuid) to authenticated;

commit;
