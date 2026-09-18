begin;

-- SECURITY DEFINER functions use an empty search_path. Defer all deferrable
-- constraints instead of resolving an unqualified constraint name.
create or replace function public.reconcile_event_schedule(target_schedule_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  schedule_row public.event_schedules%rowtype;
begin
  select * into schedule_row
    from public.event_schedules
   where id = target_schedule_id
   for update;
  if not found or schedule_row.status <> 'draft' then return; end if;

  set constraints all deferred;
  delete from public.event_schedule_matches scheduled
  using public.bracket_matches bracket_match, public.bracket_groups bracket_group, public.category_brackets bracket
  where scheduled.schedule_id = schedule_row.id
    and scheduled.match_id = bracket_match.id
    and bracket_match.group_id = bracket_group.id
    and bracket_group.bracket_id = bracket.id
    and (
      bracket.event_id <> schedule_row.event_id
      or bracket.mode <> 'competicao'
      or bracket.status not in ('publicada', 'em_andamento', 'concluida')
    );

  delete from public.event_schedule_groups assignment
  using public.bracket_groups bracket_group, public.category_brackets bracket
  where assignment.schedule_id = schedule_row.id
    and assignment.group_id = bracket_group.id
    and bracket_group.bracket_id = bracket.id
    and (
      bracket.event_id <> schedule_row.event_id
      or bracket.mode <> 'competicao'
      or bracket.status not in ('publicada', 'em_andamento', 'concluida')
    );

  with numbered as (
    select match_id, row_number() over (order by fight_number)::integer as next_number
      from public.event_schedule_matches
     where schedule_id = schedule_row.id
  )
  update public.event_schedule_matches scheduled
     set fight_number = numbered.next_number
    from numbered
   where scheduled.match_id = numbered.match_id;
end;
$fn$;

create or replace function public.unassign_schedule_group(target_group_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  assignment public.event_schedule_groups%rowtype;
  schedule_row public.event_schedules%rowtype;
  target_event public.events%rowtype;
begin
  select * into assignment
    from public.event_schedule_groups
   where group_id = target_group_id;
  if not found then raise exception 'Subchave nao esta programada'; end if;
  select * into schedule_row from public.event_schedules where id = assignment.schedule_id;
  target_event := public.event_schedule_load_event(schedule_row.event_id, true);
  perform pg_advisory_xact_lock(hashtextextended('event_schedule:' || target_event.id::text, 0));
  select * into schedule_row
    from public.event_schedules
   where id = assignment.schedule_id
   for update;
  select * into assignment
    from public.event_schedule_groups
   where group_id = target_group_id
   for update;
  if not found then raise exception 'Subchave nao esta programada'; end if;
  if schedule_row.status <> 'draft' then raise exception 'Programacao publicada nao pode ser alterada'; end if;
  set constraints all deferred;

  delete from public.event_schedule_matches scheduled
  using public.bracket_matches bracket_match
  where scheduled.match_id = bracket_match.id
    and scheduled.schedule_id = schedule_row.id
    and bracket_match.group_id = assignment.group_id;
  delete from public.event_schedule_groups where group_id = assignment.group_id;

  with numbered as (
    select match_id, row_number() over (order by fight_number)::integer as next_number
      from public.event_schedule_matches
     where schedule_id = schedule_row.id
  )
  update public.event_schedule_matches scheduled
     set fight_number = numbered.next_number
    from numbered
   where scheduled.match_id = numbered.match_id;

  insert into public.event_audit_logs(
    organization_id, event_id, actor_id, action, resource_type, resource_id, before_data
  ) values (
    target_event.organization_id, target_event.id, auth.uid(),
    'schedule_group_unassigned', 'bracket_group', assignment.group_id,
    jsonb_build_object('areaId', assignment.area_id)
  );
  return jsonb_build_object('kind', 'group_unassigned', 'groupId', assignment.group_id);
end;
$fn$;

create or replace function public.reorder_event_schedule(
  target_event_id uuid,
  ordered_match_ids uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  target_event public.events%rowtype;
  schedule_row public.event_schedules%rowtype;
  scheduled_count integer;
begin
  target_event := public.event_schedule_load_event(target_event_id, true);
  perform pg_advisory_xact_lock(hashtextextended('event_schedule:' || target_event.id::text, 0));
  select * into schedule_row
    from public.event_schedules
   where event_id = target_event.id
   for update;
  if not found then raise exception 'Programacao inexistente'; end if;
  if schedule_row.status <> 'draft' then raise exception 'Programacao publicada nao pode ser alterada'; end if;

  select count(*) into scheduled_count
    from public.event_schedule_matches
   where schedule_id = schedule_row.id;
  if ordered_match_ids is null
     or coalesce(array_length(ordered_match_ids, 1), 0) <> scheduled_count
     or (
       select count(distinct item.match_id)
         from unnest(ordered_match_ids) as item(match_id)
     ) <> scheduled_count
     or exists (
       select 1 from unnest(ordered_match_ids) as item(match_id)
       where not exists (
         select 1 from public.event_schedule_matches scheduled
          where scheduled.schedule_id = schedule_row.id
            and scheduled.match_id = item.match_id
       )
     ) then
    raise exception 'Ordem deve conter exatamente todas as lutas programadas';
  end if;

  set constraints all deferred;
  with requested as (
    select id as match_id, ordinality::integer as next_number
      from unnest(ordered_match_ids) with ordinality as item(id, ordinality)
  )
  update public.event_schedule_matches scheduled
     set fight_number = requested.next_number
    from requested
   where scheduled.schedule_id = schedule_row.id
     and scheduled.match_id = requested.match_id;

  if exists (
    select 1
      from public.bracket_matches target
      join public.event_schedule_matches target_schedule on target_schedule.match_id = target.id
      join public.event_schedule_matches source_schedule
        on source_schedule.match_id in (target.side_a_source_match_id, target.side_b_source_match_id)
     where target_schedule.schedule_id = schedule_row.id
       and source_schedule.schedule_id = schedule_row.id
       and source_schedule.fight_number >= target_schedule.fight_number
  ) then
    raise exception 'Luta dependente deve permanecer depois das lutas de origem';
  end if;

  update public.event_schedules set updated_at = now() where id = schedule_row.id;
  insert into public.event_audit_logs(
    organization_id, event_id, actor_id, action, resource_type, resource_id, after_data
  ) values (
    target_event.organization_id, target_event.id, auth.uid(),
    'event_schedule_reordered', 'event_schedule', schedule_row.id,
    jsonb_build_object('matchIds', to_jsonb(ordered_match_ids))
  );
  return jsonb_build_object('kind', 'schedule_reordered', 'count', scheduled_count);
end;
$fn$;

commit;
