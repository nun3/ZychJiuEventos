-- Sprint 10: checklist operacional de pesagem e premiacao por subchave.
-- Nao reabre resultados, numeracao, areas ou pesagem individual por atleta.
begin;

create table public.bracket_group_operations (
  group_id uuid primary key references public.bracket_groups(id) on delete cascade,
  weigh_in_confirmed_at timestamptz,
  weigh_in_confirmed_by uuid references public.profiles(id),
  awards_confirmed_at timestamptz,
  awards_confirmed_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(),
  check (
    (weigh_in_confirmed_at is null) = (weigh_in_confirmed_by is null)
  ),
  check (
    (awards_confirmed_at is null) = (awards_confirmed_by is null)
  )
);

create index bracket_group_operations_weigh_in_idx
  on public.bracket_group_operations (weigh_in_confirmed_by)
  where weigh_in_confirmed_by is not null;

create index bracket_group_operations_awards_idx
  on public.bracket_group_operations (awards_confirmed_by)
  where awards_confirmed_by is not null;

alter table public.bracket_group_operations enable row level security;

create policy bracket_group_operations_staff_select on public.bracket_group_operations
for select
using (exists (
  select 1
    from public.bracket_groups bracket_group
    join public.category_brackets bracket on bracket.id = bracket_group.bracket_id
    join public.events event_row on event_row.id = bracket.event_id
   where bracket_group.id = group_id
     and public.has_organization_role(
       event_row.organization_id,
       array['owner', 'organizer', 'staff']::public.organization_role[]
     )
));

revoke all on table public.bracket_group_operations from public, anon, authenticated;
grant select on table public.bracket_group_operations to authenticated;

create or replace function public.protect_bracket_group_operations()
returns trigger
language plpgsql
set search_path = ''
as $fn$
begin
  if current_setting('jiu.allow_group_checklist', true) is distinct from '1' then
    raise exception 'Checklist operacional so pode ser alterado pela operacao autorizada';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$fn$;

drop trigger if exists protect_bracket_group_operations on public.bracket_group_operations;
create trigger protect_bracket_group_operations
before insert or update on public.bracket_group_operations
for each row execute function public.protect_bracket_group_operations();

create or replace function public.bracket_group_has_completed_result(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $fn$
  select jsonb_array_length(public.bracket_group_placements_to_json(target_group_id, false)) > 0;
$fn$;

create or replace function public.bracket_group_checklist_to_json(target_group_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  operation public.bracket_group_operations%rowtype;
  weigh_in_name text;
  awards_name text;
begin
  select * into operation
    from public.bracket_group_operations
   where group_id = target_group_id;

  if operation.weigh_in_confirmed_by is not null then
    select nome_completo into weigh_in_name
      from public.profiles
     where id = operation.weigh_in_confirmed_by;
  end if;
  if operation.awards_confirmed_by is not null then
    select nome_completo into awards_name
      from public.profiles
     where id = operation.awards_confirmed_by;
  end if;

  return jsonb_build_object(
    'groupId', target_group_id,
    'weighIn', jsonb_build_object(
      'status', case when operation.weigh_in_confirmed_at is null then 'pendente' else 'realizada' end,
      'confirmedAt', operation.weigh_in_confirmed_at,
      'confirmedBy', operation.weigh_in_confirmed_by,
      'confirmedByName', weigh_in_name
    ),
    'awards', jsonb_build_object(
      'status', case when operation.awards_confirmed_at is null then 'pendente' else 'realizada' end,
      'confirmedAt', operation.awards_confirmed_at,
      'confirmedBy', operation.awards_confirmed_by,
      'confirmedByName', awards_name
    ),
    'resultStatus', case
      when public.bracket_group_has_completed_result(target_group_id) then 'registrado'
      else 'pendente'
    end
  );
end;
$fn$;

create or replace function public.bracket_group_checklist_prepare(target_group_id uuid)
returns public.events
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  group_row public.bracket_groups%rowtype;
  bracket_row public.category_brackets%rowtype;
  target_event public.events%rowtype;
begin
  if target_group_id is null then raise exception 'Subchave obrigatoria'; end if;
  select * into group_row from public.bracket_groups where id = target_group_id;
  if not found then raise exception 'Subchave inexistente'; end if;

  select * into bracket_row from public.category_brackets where id = group_row.bracket_id;
  if not found then raise exception 'Chave inexistente'; end if;
  if bracket_row.mode <> 'competicao' then
    raise exception 'Categoria sem confronto nao possui checklist operacional';
  end if;
  if bracket_row.status not in ('publicada', 'em_andamento', 'concluida') then
    raise exception 'Somente subchave oficial pode ter checklist operacional';
  end if;

  select * into target_event from public.events where id = bracket_row.event_id;
  if not found then raise exception 'Evento inexistente'; end if;
  perform public.category_bracket_require_staff(target_event);
  if target_event.status not in ('chaves', 'em_andamento', 'concluido') then
    raise exception 'Evento fora da fase operacional';
  end if;

  perform public.category_bracket_lock(bracket_row.event_id, bracket_row.category_id);
  return target_event;
end;
$fn$;

create or replace function public.confirm_bracket_group_weigh_in(target_group_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  target_event public.events%rowtype;
  actor uuid := auth.uid();
  existing public.bracket_group_operations%rowtype;
begin
  target_event := public.bracket_group_checklist_prepare(target_group_id);
  select * into existing from public.bracket_group_operations where group_id = target_group_id for update;
  if existing.weigh_in_confirmed_at is not null then
    raise exception 'Pesagem ja realizada';
  end if;

  perform set_config('jiu.allow_group_checklist', '1', true);
  insert into public.bracket_group_operations(
    group_id, weigh_in_confirmed_at, weigh_in_confirmed_by, updated_at
  ) values (
    target_group_id, clock_timestamp(), actor, clock_timestamp()
  )
  on conflict (group_id) do update
    set weigh_in_confirmed_at = excluded.weigh_in_confirmed_at,
        weigh_in_confirmed_by = excluded.weigh_in_confirmed_by,
        updated_at = excluded.updated_at;

  insert into public.event_audit_logs(
    organization_id, event_id, actor_id, action, resource_type, resource_id, after_data
  ) values (
    target_event.organization_id, target_event.id, actor,
    'group_weigh_in_confirmed', 'bracket_group', target_group_id,
    jsonb_build_object('status', 'realizada')
  );

  return public.bracket_group_checklist_to_json(target_group_id);
end;
$fn$;

create or replace function public.undo_bracket_group_weigh_in(target_group_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  target_event public.events%rowtype;
  actor uuid := auth.uid();
  existing public.bracket_group_operations%rowtype;
begin
  target_event := public.bracket_group_checklist_prepare(target_group_id);
  select * into existing from public.bracket_group_operations where group_id = target_group_id for update;
  if existing.weigh_in_confirmed_at is null then
    raise exception 'Pesagem ainda pendente';
  end if;
  if existing.awards_confirmed_at is not null then
    raise exception 'Premiacao ja realizada; pesagem nao pode ser desfeita';
  end if;

  perform set_config('jiu.allow_group_checklist', '1', true);
  update public.bracket_group_operations
     set weigh_in_confirmed_at = null,
         weigh_in_confirmed_by = null,
         updated_at = clock_timestamp()
   where group_id = target_group_id;

  insert into public.event_audit_logs(
    organization_id, event_id, actor_id, action, resource_type, resource_id, before_data, after_data
  ) values (
    target_event.organization_id, target_event.id, actor,
    'group_weigh_in_undone', 'bracket_group', target_group_id,
    jsonb_build_object('status', 'realizada', 'confirmedAt', existing.weigh_in_confirmed_at, 'confirmedBy', existing.weigh_in_confirmed_by),
    jsonb_build_object('status', 'pendente')
  );

  return public.bracket_group_checklist_to_json(target_group_id);
end;
$fn$;

create or replace function public.confirm_bracket_group_awards(target_group_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  target_event public.events%rowtype;
  actor uuid := auth.uid();
  existing public.bracket_group_operations%rowtype;
begin
  target_event := public.bracket_group_checklist_prepare(target_group_id);
  if not public.bracket_group_has_completed_result(target_group_id) then
    raise exception 'Premiacao exige resultado concluido da subchave';
  end if;
  select * into existing from public.bracket_group_operations where group_id = target_group_id for update;
  if existing.awards_confirmed_at is not null then
    raise exception 'Premiacao ja realizada';
  end if;

  perform set_config('jiu.allow_group_checklist', '1', true);
  insert into public.bracket_group_operations(
    group_id, awards_confirmed_at, awards_confirmed_by, updated_at
  ) values (
    target_group_id, clock_timestamp(), actor, clock_timestamp()
  )
  on conflict (group_id) do update
    set awards_confirmed_at = excluded.awards_confirmed_at,
        awards_confirmed_by = excluded.awards_confirmed_by,
        updated_at = excluded.updated_at;

  insert into public.event_audit_logs(
    organization_id, event_id, actor_id, action, resource_type, resource_id, after_data
  ) values (
    target_event.organization_id, target_event.id, actor,
    'group_awards_confirmed', 'bracket_group', target_group_id,
    jsonb_build_object('status', 'realizada')
  );

  return public.bracket_group_checklist_to_json(target_group_id);
end;
$fn$;

create or replace function public.undo_bracket_group_awards(target_group_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  target_event public.events%rowtype;
  actor uuid := auth.uid();
  existing public.bracket_group_operations%rowtype;
begin
  target_event := public.bracket_group_checklist_prepare(target_group_id);
  select * into existing from public.bracket_group_operations where group_id = target_group_id for update;
  if existing.awards_confirmed_at is null then
    raise exception 'Premiacao ainda pendente';
  end if;

  perform set_config('jiu.allow_group_checklist', '1', true);
  update public.bracket_group_operations
     set awards_confirmed_at = null,
         awards_confirmed_by = null,
         updated_at = clock_timestamp()
   where group_id = target_group_id;

  insert into public.event_audit_logs(
    organization_id, event_id, actor_id, action, resource_type, resource_id, before_data, after_data
  ) values (
    target_event.organization_id, target_event.id, actor,
    'group_awards_undone', 'bracket_group', target_group_id,
    jsonb_build_object('status', 'realizada', 'confirmedAt', existing.awards_confirmed_at, 'confirmedBy', existing.awards_confirmed_by),
    jsonb_build_object('status', 'pendente')
  );

  return public.bracket_group_checklist_to_json(target_group_id);
end;
$fn$;

create or replace function public.get_event_group_checklists(target_event_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  target_event public.events%rowtype;
  groups_payload jsonb;
begin
  if target_event_id is null then raise exception 'Evento obrigatorio'; end if;
  select * into target_event from public.events where id = target_event_id;
  if not found then raise exception 'Evento inexistente'; end if;
  perform public.category_bracket_require_staff(target_event);

  select coalesce(jsonb_agg(
    public.bracket_group_checklist_to_json(bracket_group.id)
    order by category.nome, bracket_group.sort_order
  ), '[]'::jsonb)
    into groups_payload
    from public.bracket_groups bracket_group
    join public.category_brackets bracket on bracket.id = bracket_group.bracket_id
    join public.event_categories category on category.id = bracket.category_id
   where bracket.event_id = target_event_id
     and bracket.mode = 'competicao'
     and bracket.status in ('publicada', 'em_andamento', 'concluida');

  return jsonb_build_object(
    'kind', 'group_checklists',
    'groups', groups_payload
  );
end;
$fn$;

revoke execute on function public.protect_bracket_group_operations() from public, anon, authenticated;
revoke execute on function public.bracket_group_has_completed_result(uuid) from public, anon, authenticated;
revoke execute on function public.bracket_group_checklist_to_json(uuid) from public, anon, authenticated;
revoke execute on function public.bracket_group_checklist_prepare(uuid) from public, anon, authenticated;

revoke all on function public.confirm_bracket_group_weigh_in(uuid) from public, anon;
revoke all on function public.undo_bracket_group_weigh_in(uuid) from public, anon;
revoke all on function public.confirm_bracket_group_awards(uuid) from public, anon;
revoke all on function public.undo_bracket_group_awards(uuid) from public, anon;
revoke all on function public.get_event_group_checklists(uuid) from public, anon;

grant execute on function public.confirm_bracket_group_weigh_in(uuid) to authenticated;
grant execute on function public.undo_bracket_group_weigh_in(uuid) to authenticated;
grant execute on function public.confirm_bracket_group_awards(uuid) to authenticated;
grant execute on function public.undo_bracket_group_awards(uuid) to authenticated;
grant execute on function public.get_event_group_checklists(uuid) to authenticated;

commit;
