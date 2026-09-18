begin;

create or replace function public.event_schedule_load_event(
  target_event_id uuid,
  require_editable boolean default false
)
returns public.events
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  target_event public.events%rowtype;
begin
  if target_event_id is null then raise exception 'Evento obrigatorio'; end if;
  select * into target_event
    from public.events
   where id = target_event_id;
  if not found then raise exception 'Evento inexistente'; end if;

  if require_editable then
    perform public.event_schedule_require_operator(target_event);
    if target_event.status <> 'chaves' then
      raise exception 'Programacao editavel somente na fase de chaves';
    end if;
  else
    perform public.event_schedule_require_viewer(target_event);
  end if;
  return target_event;
end;
$fn$;

revoke execute on function public.event_schedule_load_event(uuid, boolean)
from public, anon, authenticated;

commit;
