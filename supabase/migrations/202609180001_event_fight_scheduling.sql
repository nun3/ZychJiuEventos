begin;

create type public.event_schedule_status as enum ('draft', 'publicada');

create table public.event_schedules (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique references public.events(id) on delete cascade,
  status public.event_schedule_status not null default 'draft',
  created_by uuid not null references public.profiles(id),
  published_by uuid references public.profiles(id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'draft' and published_by is null and published_at is null)
    or (status = 'publicada' and published_by is not null and published_at is not null)
  )
);

create table public.event_areas (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.event_schedules(id) on delete cascade,
  number smallint not null check (number > 0),
  name text not null check (length(trim(name)) between 1 and 60),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (schedule_id, number),
  unique (id, schedule_id)
);

create table public.event_schedule_groups (
  schedule_id uuid not null references public.event_schedules(id) on delete cascade,
  group_id uuid primary key references public.bracket_groups(id) on delete restrict,
  area_id uuid not null,
  assigned_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (area_id, schedule_id)
    references public.event_areas(id, schedule_id)
    on delete restrict
);

create table public.event_schedule_matches (
  schedule_id uuid not null references public.event_schedules(id) on delete cascade,
  match_id uuid primary key references public.bracket_matches(id) on delete restrict,
  fight_number integer not null check (fight_number > 0),
  created_at timestamptz not null default now(),
  unique (schedule_id, fight_number) deferrable initially deferred
);

create index event_areas_schedule_idx on public.event_areas(schedule_id, number);
create index event_schedule_groups_area_idx on public.event_schedule_groups(schedule_id, area_id);
create index event_schedule_matches_number_idx on public.event_schedule_matches(schedule_id, fight_number);

alter table public.event_schedules enable row level security;
alter table public.event_areas enable row level security;
alter table public.event_schedule_groups enable row level security;
alter table public.event_schedule_matches enable row level security;

create policy event_schedules_staff_select on public.event_schedules for select
using (exists (
  select 1
    from public.events event
   where event.id = event_id
     and (
       public.is_platform_admin()
       or public.has_organization_role(
         event.organization_id,
         array['owner', 'organizer', 'staff']::public.organization_role[]
       )
     )
));

create policy event_areas_staff_select on public.event_areas for select
using (exists (
  select 1
    from public.event_schedules schedule
    join public.events event on event.id = schedule.event_id
   where schedule.id = schedule_id
     and (
       public.is_platform_admin()
       or public.has_organization_role(
         event.organization_id,
         array['owner', 'organizer', 'staff']::public.organization_role[]
       )
     )
));

create policy event_schedule_groups_staff_select on public.event_schedule_groups for select
using (exists (
  select 1
    from public.event_schedules schedule
    join public.events event on event.id = schedule.event_id
   where schedule.id = schedule_id
     and (
       public.is_platform_admin()
       or public.has_organization_role(
         event.organization_id,
         array['owner', 'organizer', 'staff']::public.organization_role[]
       )
     )
));

create policy event_schedule_matches_staff_select on public.event_schedule_matches for select
using (exists (
  select 1
    from public.event_schedules schedule
    join public.events event on event.id = schedule.event_id
   where schedule.id = schedule_id
     and (
       public.is_platform_admin()
       or public.has_organization_role(
         event.organization_id,
         array['owner', 'organizer', 'staff']::public.organization_role[]
       )
     )
));

revoke all on table
  public.event_schedules,
  public.event_areas,
  public.event_schedule_groups,
  public.event_schedule_matches
from public, anon, authenticated;

grant select on table
  public.event_schedules,
  public.event_areas,
  public.event_schedule_groups,
  public.event_schedule_matches
to authenticated;

grant usage on type public.event_schedule_status to authenticated;

create or replace function public.event_schedule_require_viewer(target_event public.events)
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
  if not public.is_platform_admin() and not exists (
    select 1
      from public.organization_members member
     where member.organization_id = target_event.organization_id
       and member.user_id = actor
       and member.role in ('owner', 'organizer', 'staff')
  ) then
    raise exception 'Sem permissao para consultar programacao';
  end if;
end;
$fn$;

create or replace function public.event_schedule_require_operator(target_event public.events)
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
  if not public.is_platform_admin() and not exists (
    select 1
      from public.organization_members member
     where member.organization_id = target_event.organization_id
       and member.user_id = actor
       and member.role in ('owner', 'organizer')
  ) then
    raise exception 'Sem permissao para operar programacao';
  end if;
end;
$fn$;

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

create or replace function public.ensure_event_schedule(target_event_id uuid)
returns public.event_schedules
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  target_event public.events%rowtype;
  schedule_row public.event_schedules%rowtype;
begin
  target_event := public.event_schedule_load_event(target_event_id, true);
  perform pg_advisory_xact_lock(hashtextextended('event_schedule:' || target_event.id::text, 0));

  select * into schedule_row
    from public.event_schedules
   where event_id = target_event.id
   for update;
  if found then
    if schedule_row.status <> 'draft' then
      raise exception 'Programacao publicada nao pode ser alterada';
    end if;
    perform public.reconcile_event_schedule(schedule_row.id);
    return schedule_row;
  end if;

  insert into public.event_schedules(event_id, created_by)
  values (target_event.id, auth.uid())
  returning * into schedule_row;

  insert into public.event_audit_logs(
    organization_id, event_id, actor_id, action, resource_type, resource_id, after_data
  ) values (
    target_event.organization_id, target_event.id, auth.uid(),
    'event_schedule_created', 'event_schedule', schedule_row.id,
    jsonb_build_object('status', schedule_row.status)
  );
  return schedule_row;
end;
$fn$;

create or replace function public.save_event_area(
  target_event_id uuid,
  target_area_id uuid,
  area_number integer,
  area_name text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  target_event public.events%rowtype;
  schedule_row public.event_schedules%rowtype;
  area_row public.event_areas%rowtype;
  before_payload jsonb;
  normalized_name text := nullif(trim(area_name), '');
begin
  if area_number is null or area_number < 1 or area_number > 999 then
    raise exception 'Numero da area invalido';
  end if;
  if normalized_name is null or length(normalized_name) > 60 then
    raise exception 'Nome da area invalido';
  end if;
  target_event := public.event_schedule_load_event(target_event_id, true);
  schedule_row := public.ensure_event_schedule(target_event.id);

  if target_area_id is null then
    begin
      insert into public.event_areas(schedule_id, number, name)
      values (schedule_row.id, area_number, normalized_name)
      returning * into area_row;
    exception when unique_violation then
      raise exception 'Numero de area ja utilizado';
    end;
    insert into public.event_audit_logs(
      organization_id, event_id, actor_id, action, resource_type, resource_id, after_data
    ) values (
      target_event.organization_id, target_event.id, auth.uid(),
      'event_area_created', 'event_area', area_row.id,
      jsonb_build_object('number', area_row.number, 'name', area_row.name, 'active', area_row.active)
    );
  else
    select * into area_row
      from public.event_areas
     where id = target_area_id and schedule_id = schedule_row.id
     for update;
    if not found then raise exception 'Area inexistente'; end if;
    before_payload := jsonb_build_object('number', area_row.number, 'name', area_row.name, 'active', area_row.active);
    begin
      update public.event_areas
         set number = area_number, name = normalized_name, updated_at = now()
       where id = area_row.id
       returning * into area_row;
    exception when unique_violation then
      raise exception 'Numero de area ja utilizado';
    end;
    insert into public.event_audit_logs(
      organization_id, event_id, actor_id, action, resource_type, resource_id, before_data, after_data
    ) values (
      target_event.organization_id, target_event.id, auth.uid(),
      'event_area_updated', 'event_area', area_row.id, before_payload,
      jsonb_build_object('number', area_row.number, 'name', area_row.name, 'active', area_row.active)
    );
  end if;

  return jsonb_build_object(
    'kind', 'area',
    'areaId', area_row.id,
    'number', area_row.number,
    'name', area_row.name,
    'active', area_row.active
  );
end;
$fn$;

create or replace function public.set_event_area_active(
  target_area_id uuid,
  next_active boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  area_row public.event_areas%rowtype;
  schedule_row public.event_schedules%rowtype;
  target_event public.events%rowtype;
begin
  select * into area_row from public.event_areas where id = target_area_id;
  if not found then raise exception 'Area inexistente'; end if;
  select * into schedule_row from public.event_schedules where id = area_row.schedule_id;
  target_event := public.event_schedule_load_event(schedule_row.event_id, true);
  perform pg_advisory_xact_lock(hashtextextended('event_schedule:' || target_event.id::text, 0));
  select * into schedule_row
    from public.event_schedules
   where id = area_row.schedule_id
   for update;
  if schedule_row.status <> 'draft' then raise exception 'Programacao publicada nao pode ser alterada'; end if;
  if next_active is false and exists (
    select 1 from public.event_schedule_groups assignment where assignment.area_id = area_row.id
  ) then
    raise exception 'Area com subchave atribuida nao pode ser desativada';
  end if;
  update public.event_areas
     set active = next_active, updated_at = now()
   where id = area_row.id
   returning * into area_row;
  insert into public.event_audit_logs(
    organization_id, event_id, actor_id, action, resource_type, resource_id, after_data
  ) values (
    target_event.organization_id, target_event.id, auth.uid(),
    'event_area_status_changed', 'event_area', area_row.id,
    jsonb_build_object('active', area_row.active)
  );
  return jsonb_build_object('kind', 'area', 'areaId', area_row.id, 'active', area_row.active);
end;
$fn$;

create or replace function public.assign_schedule_group(
  target_group_id uuid,
  target_area_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  group_row public.bracket_groups%rowtype;
  bracket_row public.category_brackets%rowtype;
  target_event public.events%rowtype;
  schedule_row public.event_schedules%rowtype;
  area_row public.event_areas%rowtype;
  current_max integer;
  previous_area uuid;
begin
  select * into group_row from public.bracket_groups where id = target_group_id;
  if not found then raise exception 'Subchave inexistente'; end if;
  select * into bracket_row from public.category_brackets where id = group_row.bracket_id;
  if bracket_row.mode <> 'competicao'
     or bracket_row.status not in ('publicada', 'em_andamento', 'concluida') then
    raise exception 'Somente subchave oficial pode ser programada';
  end if;
  target_event := public.event_schedule_load_event(bracket_row.event_id, true);
  schedule_row := public.ensure_event_schedule(target_event.id);
  if schedule_row.status <> 'draft' then raise exception 'Programacao publicada nao pode ser alterada'; end if;

  select * into area_row
    from public.event_areas
   where id = target_area_id and schedule_id = schedule_row.id and active
   for update;
  if not found then raise exception 'Area ativa inexistente neste evento'; end if;

  perform pg_advisory_xact_lock(hashtextextended('event_schedule:' || target_event.id::text, 0));
  select area_id into previous_area
    from public.event_schedule_groups
   where group_id = group_row.id;

  insert into public.event_schedule_groups(schedule_id, group_id, area_id)
  values (schedule_row.id, group_row.id, area_row.id)
  on conflict (group_id) do update
    set area_id = excluded.area_id, updated_at = now();

  select coalesce(max(fight_number), 0) into current_max
    from public.event_schedule_matches
   where schedule_id = schedule_row.id;

  insert into public.event_schedule_matches(schedule_id, match_id, fight_number)
  select
    schedule_row.id,
    bracket_match.id,
    current_max + row_number() over (
      order by bracket_match.round, bracket_match.pair_index, bracket_match.id
    )::integer
  from public.bracket_matches bracket_match
  where bracket_match.group_id = group_row.id
    and not exists (
      select 1
        from public.event_schedule_matches scheduled
       where scheduled.match_id = bracket_match.id
    );

  insert into public.event_audit_logs(
    organization_id, event_id, actor_id, action, resource_type, resource_id, before_data, after_data
  ) values (
    target_event.organization_id, target_event.id, auth.uid(),
    case when previous_area is null then 'schedule_group_assigned' else 'schedule_group_moved' end,
    'bracket_group', group_row.id,
    case when previous_area is null then null else jsonb_build_object('areaId', previous_area) end,
    jsonb_build_object('areaId', area_row.id)
  );

  return jsonb_build_object(
    'kind', 'group_assignment',
    'groupId', group_row.id,
    'areaId', area_row.id
  );
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

create or replace function public.assert_event_schedule_complete(target_schedule_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  schedule_row public.event_schedules%rowtype;
  expected_groups integer;
  assigned_groups integer;
  expected_matches integer;
  assigned_matches integer;
begin
  select * into schedule_row from public.event_schedules where id = target_schedule_id;
  if not found then raise exception 'Programacao inexistente'; end if;

  select count(*) into expected_groups
    from public.bracket_groups bracket_group
    join public.category_brackets bracket on bracket.id = bracket_group.bracket_id
   where bracket.event_id = schedule_row.event_id
     and bracket.mode = 'competicao'
     and bracket.status in ('publicada', 'em_andamento', 'concluida');
  select count(*) into assigned_groups
    from public.event_schedule_groups
   where schedule_id = schedule_row.id;
  if expected_groups = 0 then raise exception 'Evento sem subchaves oficiais para programar'; end if;
  if assigned_groups <> expected_groups or exists (
    select 1
      from public.bracket_groups bracket_group
      join public.category_brackets bracket on bracket.id = bracket_group.bracket_id
     where bracket.event_id = schedule_row.event_id
       and bracket.mode = 'competicao'
       and bracket.status in ('publicada', 'em_andamento', 'concluida')
       and not exists (
         select 1 from public.event_schedule_groups assignment
          where assignment.schedule_id = schedule_row.id
            and assignment.group_id = bracket_group.id
       )
  ) or exists (
    select 1
      from public.event_schedule_groups assignment
      join public.bracket_groups bracket_group on bracket_group.id = assignment.group_id
      join public.category_brackets bracket on bracket.id = bracket_group.bracket_id
     where assignment.schedule_id = schedule_row.id
       and (
         bracket.event_id <> schedule_row.event_id
         or bracket.mode <> 'competicao'
         or bracket.status not in ('publicada', 'em_andamento', 'concluida')
       )
  ) then
    raise exception 'Todas as subchaves oficiais devem possuir area';
  end if;

  if exists (
    select 1
      from public.event_schedule_groups assignment
      join public.event_areas area on area.id = assignment.area_id
     where assignment.schedule_id = schedule_row.id and not area.active
  ) then
    raise exception 'Programacao possui area inativa';
  end if;

  select count(*) into expected_matches
    from public.bracket_matches bracket_match
    join public.bracket_groups bracket_group on bracket_group.id = bracket_match.group_id
    join public.category_brackets bracket on bracket.id = bracket_group.bracket_id
   where bracket.event_id = schedule_row.event_id
     and bracket.mode = 'competicao'
     and bracket.status in ('publicada', 'em_andamento', 'concluida');
  select count(*) into assigned_matches
    from public.event_schedule_matches
   where schedule_id = schedule_row.id;
  if assigned_matches <> expected_matches or exists (
    select 1
      from public.bracket_matches bracket_match
      join public.bracket_groups bracket_group on bracket_group.id = bracket_match.group_id
      join public.category_brackets bracket on bracket.id = bracket_group.bracket_id
     where bracket.event_id = schedule_row.event_id
       and bracket.mode = 'competicao'
       and bracket.status in ('publicada', 'em_andamento', 'concluida')
       and not exists (
         select 1 from public.event_schedule_matches scheduled
          where scheduled.schedule_id = schedule_row.id
            and scheduled.match_id = bracket_match.id
       )
  ) or exists (
    select 1
      from public.event_schedule_matches scheduled
      join public.bracket_matches bracket_match on bracket_match.id = scheduled.match_id
      join public.bracket_groups bracket_group on bracket_group.id = bracket_match.group_id
      join public.category_brackets bracket on bracket.id = bracket_group.bracket_id
     where scheduled.schedule_id = schedule_row.id
       and (
         bracket.event_id <> schedule_row.event_id
         or bracket.mode <> 'competicao'
         or bracket.status not in ('publicada', 'em_andamento', 'concluida')
       )
  ) then
    raise exception 'Todas as lutas oficiais devem estar numeradas';
  end if;
  if not exists (
    select 1 from public.event_schedule_matches
     where schedule_id = schedule_row.id and fight_number = 1
  ) or (
    select max(fight_number) from public.event_schedule_matches where schedule_id = schedule_row.id
  ) <> assigned_matches then
    raise exception 'Numeracao global deve ser continua no rascunho';
  end if;

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
    raise exception 'Programacao possui luta antes da origem';
  end if;
end;
$fn$;

create or replace function public.publish_event_schedule(target_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  target_event public.events%rowtype;
  schedule_row public.event_schedules%rowtype;
begin
  target_event := public.event_schedule_load_event(target_event_id, true);
  perform pg_advisory_xact_lock(hashtextextended('event_schedule:' || target_event.id::text, 0));
  select * into schedule_row
    from public.event_schedules
   where event_id = target_event.id
   for update;
  if not found then raise exception 'Programacao inexistente'; end if;
  if schedule_row.status = 'publicada' then
    return jsonb_build_object('kind', 'schedule_published', 'scheduleId', schedule_row.id, 'status', schedule_row.status);
  end if;
  perform public.assert_event_schedule_complete(schedule_row.id);
  update public.event_schedules
     set status = 'publicada',
         published_by = auth.uid(),
         published_at = now(),
         updated_at = now()
   where id = schedule_row.id
   returning * into schedule_row;
  insert into public.event_audit_logs(
    organization_id, event_id, actor_id, action, resource_type, resource_id, after_data
  ) values (
    target_event.organization_id, target_event.id, auth.uid(),
    'event_schedule_published', 'event_schedule', schedule_row.id,
    jsonb_build_object('status', schedule_row.status, 'publishedAt', schedule_row.published_at)
  );
  return jsonb_build_object(
    'kind', 'schedule_published',
    'scheduleId', schedule_row.id,
    'status', schedule_row.status,
    'publishedAt', schedule_row.published_at
  );
end;
$fn$;

create or replace function public.get_event_schedule_operation(target_event_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  target_event public.events%rowtype;
  schedule_row public.event_schedules%rowtype;
  areas_payload jsonb;
  groups_payload jsonb;
begin
  target_event := public.event_schedule_load_event(target_event_id, false);
  select * into schedule_row from public.event_schedules where event_id = target_event.id;

  if not found then
    return jsonb_build_object(
      'kind', 'schedule',
      'eventId', target_event.id,
      'eventStatus', target_event.status,
      'status', null,
      'editable', target_event.status = 'chaves',
      'areas', '[]'::jsonb,
      'groups', coalesce((
        select jsonb_agg(jsonb_build_object(
          'groupId', bracket_group.id,
          'category', category.nome,
          'label', bracket_group.label,
          'topology', bracket_group.topology,
          'areaId', null,
          'matches', coalesce((
            select jsonb_agg(jsonb_build_object(
              'matchId', bracket_match.id,
              'fightNumber', null,
              'round', bracket_match.round,
              'order', bracket_match.pair_index,
              'status', bracket_match.status,
              'sideA', public.bracket_entry_to_json(public.bracket_resolve_match_side(bracket_match.id, 'A'), true),
              'sideB', public.bracket_entry_to_json(public.bracket_resolve_match_side(bracket_match.id, 'B'), true)
            ) order by bracket_match.round, bracket_match.pair_index)
            from public.bracket_matches bracket_match
            where bracket_match.group_id = bracket_group.id
          ), '[]'::jsonb)
        ) order by category.nome, bracket_group.sort_order)
        from public.bracket_groups bracket_group
        join public.category_brackets bracket on bracket.id = bracket_group.bracket_id
        join public.event_categories category on category.id = bracket.category_id
        where bracket.event_id = target_event.id
          and bracket.mode = 'competicao'
          and bracket.status in ('publicada', 'em_andamento', 'concluida')
      ), '[]'::jsonb)
    );
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'areaId', area.id,
    'number', area.number,
    'name', area.name,
    'active', area.active
  ) order by area.number), '[]'::jsonb)
  into areas_payload
  from public.event_areas area
  where area.schedule_id = schedule_row.id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'groupId', bracket_group.id,
    'category', category.nome,
    'label', bracket_group.label,
    'topology', bracket_group.topology,
    'areaId', assignment.area_id,
    'matches', coalesce((
      select jsonb_agg(jsonb_build_object(
        'matchId', bracket_match.id,
        'fightNumber', scheduled_match.fight_number,
        'round', bracket_match.round,
        'order', bracket_match.pair_index,
        'status', bracket_match.status,
        'sideA', public.bracket_entry_to_json(public.bracket_resolve_match_side(bracket_match.id, 'A'), true),
        'sideB', public.bracket_entry_to_json(public.bracket_resolve_match_side(bracket_match.id, 'B'), true)
      ) order by scheduled_match.fight_number nulls last, bracket_match.round, bracket_match.pair_index)
      from public.bracket_matches bracket_match
      left join public.event_schedule_matches scheduled_match
        on scheduled_match.match_id = bracket_match.id
       and scheduled_match.schedule_id = schedule_row.id
      where bracket_match.group_id = bracket_group.id
    ), '[]'::jsonb)
  ) order by category.nome, bracket_group.sort_order), '[]'::jsonb)
  into groups_payload
  from public.bracket_groups bracket_group
  join public.category_brackets bracket on bracket.id = bracket_group.bracket_id
  join public.event_categories category on category.id = bracket.category_id
  left join public.event_schedule_groups assignment
    on assignment.group_id = bracket_group.id
   and assignment.schedule_id = schedule_row.id
  where bracket.event_id = target_event.id
    and bracket.mode = 'competicao'
    and bracket.status in ('publicada', 'em_andamento', 'concluida');

  return jsonb_build_object(
    'kind', 'schedule',
    'scheduleId', schedule_row.id,
    'eventId', target_event.id,
    'eventStatus', target_event.status,
    'status', schedule_row.status,
    'editable', schedule_row.status = 'draft' and target_event.status = 'chaves',
    'publishedAt', schedule_row.published_at,
    'areas', areas_payload,
    'groups', groups_payload
  );
end;
$fn$;

create or replace function public.freeze_event_schedule_on_start()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  schedule_row public.event_schedules%rowtype;
begin
  if old.status = 'chaves' and new.status = 'em_andamento' then
    perform pg_advisory_xact_lock(hashtextextended('event_schedule:' || new.id::text, 0));
    select * into schedule_row
      from public.event_schedules
     where event_id = new.id
     for update;
    if found then
      perform public.assert_event_schedule_complete(schedule_row.id);
      if schedule_row.status = 'draft' then
        update public.event_schedules
           set status = 'publicada',
               published_by = auth.uid(),
               published_at = now(),
               updated_at = now()
         where id = schedule_row.id;
        insert into public.event_audit_logs(
          organization_id, event_id, actor_id, action, resource_type, resource_id, after_data
        ) values (
          new.organization_id, new.id, auth.uid(),
          'event_schedule_published_on_start', 'event_schedule', schedule_row.id,
          jsonb_build_object('status', 'publicada', 'trigger', 'event_start')
        );
      end if;
    end if;
  end if;
  return new;
end;
$fn$;

create or replace function public.protect_published_schedule_bracket()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  if (
       (old.status in ('publicada', 'em_andamento', 'concluida') and new.status = 'substituida')
       or (old.status = 'draft' and new.status = 'publicada')
     )
     and exists (
       select 1
         from public.event_schedules schedule
        where schedule.event_id = old.event_id
          and schedule.status = 'publicada'
     ) then
    raise exception 'Chave vinculada a programacao publicada nao pode ser regenerada';
  end if;
  return new;
end;
$fn$;

drop trigger if exists event_schedule_freeze_on_start on public.events;
create trigger event_schedule_freeze_on_start
before update of status on public.events
for each row execute function public.freeze_event_schedule_on_start();

drop trigger if exists bracket_protect_published_schedule on public.category_brackets;
create trigger bracket_protect_published_schedule
before update of status on public.category_brackets
for each row execute function public.protect_published_schedule_bracket();

revoke execute on function public.event_schedule_require_viewer(public.events) from public, anon, authenticated;
revoke execute on function public.event_schedule_require_operator(public.events) from public, anon, authenticated;
revoke execute on function public.event_schedule_load_event(uuid, boolean) from public, anon, authenticated;
revoke execute on function public.reconcile_event_schedule(uuid) from public, anon, authenticated;
revoke execute on function public.ensure_event_schedule(uuid) from public, anon, authenticated;
revoke execute on function public.assert_event_schedule_complete(uuid) from public, anon, authenticated;
revoke execute on function public.freeze_event_schedule_on_start() from public, anon, authenticated;
revoke execute on function public.protect_published_schedule_bracket() from public, anon, authenticated;

revoke all on function public.save_event_area(uuid, uuid, integer, text) from public, anon;
revoke all on function public.set_event_area_active(uuid, boolean) from public, anon;
revoke all on function public.assign_schedule_group(uuid, uuid) from public, anon;
revoke all on function public.unassign_schedule_group(uuid) from public, anon;
revoke all on function public.reorder_event_schedule(uuid, uuid[]) from public, anon;
revoke all on function public.publish_event_schedule(uuid) from public, anon;
revoke all on function public.get_event_schedule_operation(uuid) from public, anon;

grant execute on function public.save_event_area(uuid, uuid, integer, text) to authenticated;
grant execute on function public.set_event_area_active(uuid, boolean) to authenticated;
grant execute on function public.assign_schedule_group(uuid, uuid) to authenticated;
grant execute on function public.unassign_schedule_group(uuid) to authenticated;
grant execute on function public.reorder_event_schedule(uuid, uuid[]) to authenticated;
grant execute on function public.publish_event_schedule(uuid) to authenticated;
grant execute on function public.get_event_schedule_operation(uuid) to authenticated;

commit;
