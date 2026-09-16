begin;

create or replace function public.enforce_event_status_transition()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  transition_allowed boolean;
begin
  if new.status = old.status then return new; end if;

  transition_allowed :=
    (old.status = 'rascunho' and new.status = 'publicado') or
    (old.status = 'publicado' and new.status = 'inscricao') or
    (old.status = 'inscricao' and new.status = 'pagamento') or
    (old.status = 'pagamento' and new.status = 'checagem') or
    (old.status = 'checagem' and new.status = 'chaves') or
    (old.status = 'chaves' and new.status = 'em_andamento') or
    (old.status = 'em_andamento' and new.status = 'concluido') or
    (old.status <> 'concluido' and new.status = 'cancelado');

  if not transition_allowed then
    raise exception 'Transicao de evento invalida: % -> %', old.status, new.status
      using errcode = '23514';
  end if;

  insert into public.event_audit_logs (
    organization_id, event_id, actor_id, action, resource_type,
    resource_id, before_data, after_data
  ) values (
    old.organization_id, old.id, auth.uid(), 'status_changed', 'event',
    old.id, jsonb_build_object('status', old.status), jsonb_build_object('status', new.status)
  );
  return new;
end;
$$;

drop trigger if exists event_status_transition_guard on public.events;
create trigger event_status_transition_guard
before update of status on public.events
for each row execute function public.enforce_event_status_transition();

revoke execute on function public.enforce_event_status_transition() from public;
commit;
