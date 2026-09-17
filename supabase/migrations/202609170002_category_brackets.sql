-- Sprint 8 lote 1: dominio de chaves em DRAFT (gerar, casar, publicar, regenerar).
-- Nao lanca resultado, WO, pesagem, area ou consulta publica.
begin;

create type public.bracket_mode as enum ('competicao', 'sem_confronto');
create type public.bracket_status as enum ('draft', 'publicada', 'em_andamento', 'concluida', 'substituida');
create type public.bracket_topology as enum ('final_2', 'copo_3', 'semi_4');
create type public.match_round as enum ('semifinal', 'final');
create type public.match_status as enum ('pendente', 'concluido', 'wo');

create table public.category_brackets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete restrict,
  category_id uuid not null references public.event_categories(id) on delete restrict,
  version integer not null check (version > 0),
  mode public.bracket_mode not null,
  status public.bracket_status not null,
  source_checagem_travada_em timestamptz not null,
  generated_by uuid not null references public.profiles(id),
  generated_at timestamptz not null default now(),
  published_by uuid references public.profiles(id),
  published_at timestamptz,
  supersedes_id uuid references public.category_brackets(id) on delete restrict,
  regeneration_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, category_id, version),
  check (
    (mode <> 'sem_confronto') or (status <> 'em_andamento')
  ),
  check (
    (version = 1 and regeneration_reason is null)
    or (
      version > 1
      and regeneration_reason is not null
      and length(trim(regeneration_reason)) >= 5
    )
  ),
  check (
    (status in ('publicada', 'em_andamento', 'concluida') and published_by is not null and published_at is not null)
    or (status not in ('publicada', 'em_andamento', 'concluida'))
  )
);

create unique index category_brackets_one_draft
  on public.category_brackets (event_id, category_id)
  where status = 'draft';

create unique index category_brackets_one_live
  on public.category_brackets (event_id, category_id)
  where status in ('publicada', 'em_andamento', 'concluida');

create index category_brackets_event_category_idx
  on public.category_brackets (event_id, category_id, status);

create table public.bracket_participants (
  id uuid primary key default gen_random_uuid(),
  bracket_id uuid not null references public.category_brackets(id) on delete restrict,
  registration_id uuid not null references public.registrations(id) on delete restrict,
  athlete_id uuid not null references public.athletes(id) on delete restrict,
  nome_exibido text not null check (length(trim(nome_exibido)) >= 1),
  team_id uuid references public.teams(id) on delete restrict,
  team_name text,
  source_order integer not null check (source_order >= 1),
  created_at timestamptz not null default now(),
  unique (bracket_id, registration_id),
  unique (bracket_id, source_order),
  unique (id, bracket_id)
);

create table public.bracket_groups (
  id uuid primary key default gen_random_uuid(),
  bracket_id uuid not null references public.category_brackets(id) on delete restrict,
  label text not null check (label ~ '^[A-Z]$'),
  sort_order integer not null check (sort_order >= 0),
  topology public.bracket_topology not null,
  created_at timestamptz not null default now(),
  unique (bracket_id, label),
  unique (bracket_id, sort_order),
  unique (id, bracket_id)
);

create table public.bracket_entries (
  id uuid primary key default gen_random_uuid(),
  bracket_id uuid not null,
  group_id uuid not null,
  participant_id uuid not null,
  slot smallint not null check (slot between 1 and 4),
  created_at timestamptz not null default now(),
  unique (group_id, slot),
  unique (participant_id),
  unique (id, group_id),
  unique (id, bracket_id),
  foreign key (group_id, bracket_id)
    references public.bracket_groups (id, bracket_id) on delete cascade,
  foreign key (participant_id, bracket_id)
    references public.bracket_participants (id, bracket_id) on delete restrict
);

create table public.bracket_matches (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.bracket_groups(id) on delete cascade,
  round public.match_round not null,
  pair_index smallint not null check (pair_index >= 1),
  side_a_entry_id uuid,
  side_a_source_match_id uuid,
  side_b_entry_id uuid,
  side_b_source_match_id uuid,
  winner_entry_id uuid,
  status public.match_status not null default 'pendente',
  created_at timestamptz not null default now(),
  unique (group_id, round, pair_index),
  unique (id, group_id),
  check (
    ((side_a_entry_id is null) <> (side_a_source_match_id is null))
    and ((side_b_entry_id is null) <> (side_b_source_match_id is null))
  ),
  check (side_a_entry_id is distinct from side_b_entry_id),
  check (side_a_source_match_id is distinct from side_b_source_match_id)
);

alter table public.bracket_matches
  add constraint bracket_matches_side_a_entry_fk
    foreign key (side_a_entry_id, group_id)
    references public.bracket_entries (id, group_id),
  add constraint bracket_matches_side_b_entry_fk
    foreign key (side_b_entry_id, group_id)
    references public.bracket_entries (id, group_id),
  add constraint bracket_matches_winner_entry_fk
    foreign key (winner_entry_id, group_id)
    references public.bracket_entries (id, group_id),
  add constraint bracket_matches_side_a_source_fk
    foreign key (side_a_source_match_id, group_id)
    references public.bracket_matches (id, group_id)
    deferrable initially deferred,
  add constraint bracket_matches_side_b_source_fk
    foreign key (side_b_source_match_id, group_id)
    references public.bracket_matches (id, group_id)
    deferrable initially deferred;

create index bracket_participants_bracket_idx on public.bracket_participants (bracket_id);
create index bracket_groups_bracket_idx on public.bracket_groups (bracket_id);
create index bracket_entries_group_idx on public.bracket_entries (group_id);
create index bracket_matches_group_idx on public.bracket_matches (group_id);

alter table public.category_brackets enable row level security;
alter table public.bracket_participants enable row level security;
alter table public.bracket_groups enable row level security;
alter table public.bracket_entries enable row level security;
alter table public.bracket_matches enable row level security;

create policy category_brackets_staff_select on public.category_brackets for select
using (exists (
  select 1 from public.events e
  where e.id = event_id
    and public.has_organization_role(
      e.organization_id,
      array['owner','organizer','staff']::public.organization_role[]
    )
));

create policy bracket_participants_staff_select on public.bracket_participants for select
using (exists (
  select 1 from public.category_brackets b
  join public.events e on e.id = b.event_id
  where b.id = bracket_id
    and public.has_organization_role(
      e.organization_id,
      array['owner','organizer','staff']::public.organization_role[]
    )
));

create policy bracket_groups_staff_select on public.bracket_groups for select
using (exists (
  select 1 from public.category_brackets b
  join public.events e on e.id = b.event_id
  where b.id = bracket_id
    and public.has_organization_role(
      e.organization_id,
      array['owner','organizer','staff']::public.organization_role[]
    )
));

create policy bracket_entries_staff_select on public.bracket_entries for select
using (exists (
  select 1 from public.category_brackets b
  join public.events e on e.id = b.event_id
  where b.id = bracket_id
    and public.has_organization_role(
      e.organization_id,
      array['owner','organizer','staff']::public.organization_role[]
    )
));

create policy bracket_matches_staff_select on public.bracket_matches for select
using (exists (
  select 1 from public.bracket_groups g
  join public.category_brackets b on b.id = g.bracket_id
  join public.events e on e.id = b.event_id
  where g.id = group_id
    and public.has_organization_role(
      e.organization_id,
      array['owner','organizer','staff']::public.organization_role[]
    )
));

revoke all on table
  public.category_brackets,
  public.bracket_participants,
  public.bracket_groups,
  public.bracket_entries,
  public.bracket_matches
from public, anon, authenticated;

grant select on table
  public.category_brackets,
  public.bracket_participants,
  public.bracket_groups,
  public.bracket_entries,
  public.bracket_matches
to authenticated;

grant usage on type
  public.bracket_mode,
  public.bracket_status,
  public.bracket_topology,
  public.match_round,
  public.match_status
to authenticated;

create or replace function public.protect_bracket_participants()
returns trigger
language plpgsql
set search_path = ''
as $fn$
begin
  raise exception 'Participantes da chave sao imutaveis';
end;
$fn$;

drop trigger if exists protect_bracket_participants on public.bracket_participants;
create trigger protect_bracket_participants
before update on public.bracket_participants
for each row execute function public.protect_bracket_participants();

create or replace function public.category_bracket_lock(target_event_id uuid, target_category_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  perform pg_advisory_xact_lock(
    hashtextextended(
      'category_bracket:' || target_event_id::text || ':' || target_category_id::text,
      0
    )
  );
end;
$fn$;

create or replace function public.category_bracket_require_staff(target_event public.events)
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
    select 1 from public.organization_members member
    where member.organization_id = target_event.organization_id
      and member.user_id = actor
      and member.role in ('owner', 'organizer')
  ) then
    raise exception 'Sem permissao para operar chaves';
  end if;
end;
$fn$;

create or replace function public.category_bracket_load_event(target_event_id uuid)
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
   where id = target_event_id
     for share;
  if not found then raise exception 'Evento inexistente'; end if;
  if target_event.checagem_travada_em is null then
    raise exception 'Checagem ainda nao travada';
  end if;
  if target_event.status not in ('checagem', 'chaves') then
    raise exception 'Evento fora da fase de chaves';
  end if;
  perform public.category_bracket_require_staff(target_event);
  return target_event;
end;
$fn$;

create or replace function public.category_belongs_to_event(target_event_id uuid, target_category_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $fn$
  select exists (
    select 1
      from public.event_categories category
      join public.category_rule_sets rule_set on rule_set.id = category.rule_set_id
     where category.id = target_category_id
       and rule_set.event_id = target_event_id
  );
$fn$;

create or replace function public.bracket_topology_size(target_topology public.bracket_topology)
returns integer
language sql
immutable
as $fn$
  select case target_topology
    when 'final_2' then 2
    when 'copo_3' then 3
    when 'semi_4' then 4
  end;
$fn$;

create or replace function public.bracket_partition_sizes(athlete_count integer)
returns integer[]
language plpgsql
immutable
set search_path = ''
as $fn$
declare
  n4 integer;
  rem integer;
  parts integer[] := '{}';
  idx integer;
begin
  if athlete_count is null or athlete_count < 2 then
    return '{}';
  end if;
  n4 := athlete_count / 4;
  rem := athlete_count % 4;
  if rem = 1 then
    n4 := n4 - 1;
  end if;
  for idx in 1..n4 loop
    parts := parts || 4;
  end loop;
  if rem = 1 then
    parts := parts || 3 || 2;
  elsif rem = 2 then
    parts := parts || 2;
  elsif rem = 3 then
    parts := parts || 3;
  end if;
  return parts;
end;
$fn$;

create or replace function public.bracket_has_results(target_bracket_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $fn$
  select exists (
    select 1
      from public.bracket_matches match_row
      join public.bracket_groups grp on grp.id = match_row.group_id
     where grp.bracket_id = target_bracket_id
       and (
         match_row.winner_entry_id is not null
         or match_row.status is distinct from 'pendente'
       )
  );
$fn$;

create or replace function public.clear_bracket_composition(target_bracket_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  delete from public.bracket_matches match_row
   using public.bracket_groups grp
   where match_row.group_id = grp.id
     and grp.bracket_id = target_bracket_id
     and match_row.round = 'final';

  delete from public.bracket_matches match_row
   using public.bracket_groups grp
   where match_row.group_id = grp.id
     and grp.bracket_id = target_bracket_id;

  delete from public.bracket_entries entry_row
   using public.bracket_groups grp
   where entry_row.group_id = grp.id
     and grp.bracket_id = target_bracket_id;

  delete from public.bracket_groups
   where bracket_id = target_bracket_id;
end;
$fn$;

create or replace function public.insert_group_matches(target_group_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  grp public.bracket_groups%rowtype;
  slot_ids uuid[] := array[null, null, null, null];
  entry_row public.bracket_entries%rowtype;
  sf1 uuid;
  sf2 uuid;
begin
  select * into grp from public.bracket_groups where id = target_group_id;
  if not found then raise exception 'Grupo inexistente'; end if;

  for entry_row in
    select * from public.bracket_entries where group_id = target_group_id
  loop
    slot_ids[entry_row.slot] := entry_row.id;
  end loop;

  if grp.topology = 'final_2' then
    insert into public.bracket_matches (
      group_id, round, pair_index, side_a_entry_id, side_b_entry_id
    ) values (
      target_group_id, 'final', 1, slot_ids[1], slot_ids[2]
    );
  elsif grp.topology = 'copo_3' then
    insert into public.bracket_matches (
      group_id, round, pair_index, side_a_entry_id, side_b_entry_id
    ) values (
      target_group_id, 'semifinal', 1, slot_ids[1], slot_ids[3]
    ) returning id into sf1;
    insert into public.bracket_matches (
      group_id, round, pair_index, side_a_source_match_id, side_b_entry_id
    ) values (
      target_group_id, 'final', 1, sf1, slot_ids[2]
    );
  elsif grp.topology = 'semi_4' then
    insert into public.bracket_matches (
      group_id, round, pair_index, side_a_entry_id, side_b_entry_id
    ) values (
      target_group_id, 'semifinal', 1, slot_ids[1], slot_ids[3]
    ) returning id into sf1;
    insert into public.bracket_matches (
      group_id, round, pair_index, side_a_entry_id, side_b_entry_id
    ) values (
      target_group_id, 'semifinal', 2, slot_ids[2], slot_ids[4]
    ) returning id into sf2;
    insert into public.bracket_matches (
      group_id, round, pair_index, side_a_source_match_id, side_b_source_match_id
    ) values (
      target_group_id, 'final', 1, sf1, sf2
    );
  end if;
end;
$fn$;

create or replace function public.insert_group_entries(
  target_bracket_id uuid,
  target_group_id uuid,
  member_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  grp public.bracket_groups%rowtype;
  n integer;
  idx integer;
  copo integer;
  left_a integer;
  left_b integer;
  a integer;
  b integer;
  c integer;
  d integer;
  cost integer;
  best_cost integer;
  candidate integer[];
  best_tuple integer[];
  slot_of uuid[] := array[null, null, null, null];
  source_orders integer[] := '{}';
  team_ids uuid[] := '{}';
  participant_row public.bracket_participants%rowtype;
begin
  select * into grp from public.bracket_groups where id = target_group_id;
  if not found then raise exception 'Grupo inexistente'; end if;
  n := coalesce(array_length(member_ids, 1), 0);
  if n <> public.bracket_topology_size(grp.topology) then
    raise exception 'Tamanho do grupo incompativel com a topologia';
  end if;

  for idx in 1..n loop
    select * into participant_row
      from public.bracket_participants
     where id = member_ids[idx]
       and bracket_id = target_bracket_id;
    if not found then raise exception 'Participante fora da chave'; end if;
    source_orders := array_append(source_orders, participant_row.source_order);
    team_ids := array_append(team_ids, participant_row.team_id);
  end loop;

  if grp.topology = 'final_2' then
    slot_of[1] := member_ids[1];
    slot_of[2] := member_ids[2];
  elsif grp.topology = 'copo_3' then
    best_cost := null;
    for copo in 1..3 loop
      left_a := null;
      left_b := null;
      for idx in 1..3 loop
        if idx = copo then continue; end if;
        if left_a is null then left_a := idx; else left_b := idx; end if;
      end loop;
      cost := case
        when team_ids[left_a] is not null and team_ids[left_a] = team_ids[left_b] then 1
        else 0
      end;
      candidate := array[source_orders[left_a], source_orders[copo], source_orders[left_b]];
      if best_cost is null or cost < best_cost or (cost = best_cost and candidate < best_tuple) then
        best_cost := cost;
        best_tuple := candidate;
        slot_of[1] := member_ids[left_a];
        slot_of[2] := member_ids[copo];
        slot_of[3] := member_ids[left_b];
      end if;
    end loop;
  elsif grp.topology = 'semi_4' then
    best_cost := null;
    for a in 1..4 loop
      for b in 1..4 loop
        if b = a then continue; end if;
        for c in 1..4 loop
          if c = a or c = b then continue; end if;
          d := 10 - a - b - c;
          cost :=
            case when team_ids[a] is not null and team_ids[a] = team_ids[c] then 1 else 0 end
            + case when team_ids[b] is not null and team_ids[b] = team_ids[d] then 1 else 0 end;
          candidate := array[source_orders[a], source_orders[b], source_orders[c], source_orders[d]];
          if best_cost is null or cost < best_cost or (cost = best_cost and candidate < best_tuple) then
            best_cost := cost;
            best_tuple := candidate;
            slot_of[1] := member_ids[a];
            slot_of[2] := member_ids[b];
            slot_of[3] := member_ids[c];
            slot_of[4] := member_ids[d];
          end if;
        end loop;
      end loop;
    end loop;
  end if;

  for idx in 1..n loop
    insert into public.bracket_entries (bracket_id, group_id, participant_id, slot)
    values (target_bracket_id, target_group_id, slot_of[idx], idx);
  end loop;
end;
$fn$;

create or replace function public.apply_suggested_bracket_composition(target_bracket_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  bracket_row public.category_brackets%rowtype;
  athlete_count integer;
  parts integer[];
  part_size integer;
  sort_idx integer := 0;
  topology public.bracket_topology;
  participant_row public.bracket_participants%rowtype;
  chosen_group public.bracket_groups%rowtype;
  member_ids uuid[];
  grp public.bracket_groups%rowtype;
begin
  select * into bracket_row from public.category_brackets where id = target_bracket_id;
  if not found then raise exception 'Chave inexistente'; end if;
  perform public.clear_bracket_composition(target_bracket_id);

  select count(*) into athlete_count
    from public.bracket_participants
   where bracket_id = target_bracket_id;

  if bracket_row.mode = 'sem_confronto' then
    if athlete_count <> 1 then
      raise exception 'Sem confronto exige exatamente um participante';
    end if;
    return;
  end if;

  parts := public.bracket_partition_sizes(athlete_count);
  if coalesce(array_length(parts, 1), 0) = 0 then
    raise exception 'Quantidade de atletas invalida para chave';
  end if;
  if array_length(parts, 1) > 26 then
    raise exception 'Particao excede 26 grupos';
  end if;

  foreach part_size in array parts loop
    topology := case part_size
      when 2 then 'final_2'::public.bracket_topology
      when 3 then 'copo_3'::public.bracket_topology
      when 4 then 'semi_4'::public.bracket_topology
    end;
    insert into public.bracket_groups (bracket_id, label, sort_order, topology)
    values (
      target_bracket_id,
      chr(65 + sort_idx),
      sort_idx,
      topology
    );
    sort_idx := sort_idx + 1;
  end loop;

  for participant_row in
    select * from public.bracket_participants
     where bracket_id = target_bracket_id
     order by source_order, id
  loop
    select g.* into chosen_group
      from public.bracket_groups g
     where g.bracket_id = target_bracket_id
       and (
         select count(*) from public.bracket_entries e where e.group_id = g.id
       ) < public.bracket_topology_size(g.topology)
     order by (
       select count(*)
         from public.bracket_entries e
         join public.bracket_participants p on p.id = e.participant_id
        where e.group_id = g.id
          and participant_row.team_id is not null
          and p.team_id = participant_row.team_id
     ), g.sort_order
     limit 1;
    if chosen_group.id is null then
      raise exception 'Falha ao distribuir participantes nos grupos';
    end if;
    insert into public.bracket_entries (bracket_id, group_id, participant_id, slot)
    values (
      target_bracket_id,
      chosen_group.id,
      participant_row.id,
      (
        select coalesce(max(slot), 0) + 1
          from public.bracket_entries
         where group_id = chosen_group.id
      )
    );
  end loop;

  for grp in
    select * from public.bracket_groups where bracket_id = target_bracket_id order by sort_order
  loop
    select array_agg(e.participant_id order by p.source_order, p.id)
      into member_ids
      from public.bracket_entries e
      join public.bracket_participants p on p.id = e.participant_id
     where e.group_id = grp.id;
    delete from public.bracket_entries where group_id = grp.id;
    perform public.insert_group_entries(target_bracket_id, grp.id, member_ids);
    perform public.insert_group_matches(grp.id);
  end loop;
end;
$fn$;

create or replace function public.assert_bracket_structure(target_bracket_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  bracket_row public.category_brackets%rowtype;
  participant_count integer;
  group_count integer;
  grp public.bracket_groups%rowtype;
  expected integer;
  slot_idx integer;
  match_count integer;
  sf1 uuid;
  sf2 uuid;
  final_row public.bracket_matches%rowtype;
  sf_row public.bracket_matches%rowtype;
  entry_slot integer;
begin
  select * into bracket_row from public.category_brackets where id = target_bracket_id;
  if not found then raise exception 'Chave inexistente'; end if;

  select count(*) into participant_count
    from public.bracket_participants where bracket_id = target_bracket_id;
  select count(*) into group_count
    from public.bracket_groups where bracket_id = target_bracket_id;

  if bracket_row.mode = 'sem_confronto' then
    if participant_count <> 1 or group_count <> 0 then
      raise exception 'Sem confronto deve ter um participante e nenhum grupo';
    end if;
    if exists (
      select 1 from public.bracket_entries e where e.bracket_id = target_bracket_id
    ) or exists (
      select 1
        from public.bracket_matches m
        join public.bracket_groups g on g.id = m.group_id
       where g.bracket_id = target_bracket_id
    ) then
      raise exception 'Sem confronto nao pode ter entries ou matches';
    end if;
    return;
  end if;

  if participant_count < 2 then
    raise exception 'Competicao exige ao menos dois participantes';
  end if;
  if group_count < 1 then
    raise exception 'Competicao exige ao menos um grupo';
  end if;

  if exists (
    select 1 from public.bracket_participants p
     where p.bracket_id = target_bracket_id
       and not exists (
         select 1 from public.bracket_entries e where e.participant_id = p.id
       )
  ) then
    raise exception 'Participante sem posicao na chave';
  end if;

  if (
    select count(*) from public.bracket_entries e where e.bracket_id = target_bracket_id
  ) <> participant_count then
    raise exception 'Cobertura de participantes invalida';
  end if;

  for grp in select * from public.bracket_groups where bracket_id = target_bracket_id
  loop
    expected := public.bracket_topology_size(grp.topology);
    if (
      select count(*) from public.bracket_entries e where e.group_id = grp.id
    ) <> expected then
      raise exception 'Grupo % com tamanho invalido', grp.label;
    end if;
    for slot_idx in 1..expected loop
      if not exists (
        select 1 from public.bracket_entries e
         where e.group_id = grp.id and e.slot = slot_idx
      ) then
        raise exception 'Grupo % com slots incompletos', grp.label;
      end if;
    end loop;

    select count(*) into match_count from public.bracket_matches where group_id = grp.id;
    if grp.topology = 'final_2' then
      if match_count <> 1 then raise exception 'Grupo % sem final unica', grp.label; end if;
      select * into final_row
        from public.bracket_matches
       where group_id = grp.id and round = 'final' and pair_index = 1;
      select slot into entry_slot from public.bracket_entries where id = final_row.side_a_entry_id;
      if entry_slot <> 1 or final_row.side_a_source_match_id is not null then
        raise exception 'Final_2 com lado A invalido';
      end if;
      select slot into entry_slot from public.bracket_entries where id = final_row.side_b_entry_id;
      if entry_slot <> 2 or final_row.side_b_source_match_id is not null then
        raise exception 'Final_2 com lado B invalido';
      end if;
    elsif grp.topology = 'copo_3' then
      if match_count <> 2 then raise exception 'Grupo % deve ter semifinal e final', grp.label; end if;
      select * into sf_row
        from public.bracket_matches
       where group_id = grp.id and round = 'semifinal' and pair_index = 1;
      select slot into entry_slot from public.bracket_entries where id = sf_row.side_a_entry_id;
      if entry_slot <> 1 then raise exception 'Copo_3 semifinal lado A invalido'; end if;
      select slot into entry_slot from public.bracket_entries where id = sf_row.side_b_entry_id;
      if entry_slot <> 3 then raise exception 'Copo_3 semifinal lado B invalido'; end if;
      select * into final_row
        from public.bracket_matches
       where group_id = grp.id and round = 'final' and pair_index = 1;
      if final_row.side_a_source_match_id is distinct from sf_row.id
         or final_row.side_a_entry_id is not null then
        raise exception 'Copo_3 final lado A invalido';
      end if;
      select slot into entry_slot from public.bracket_entries where id = final_row.side_b_entry_id;
      if entry_slot <> 2 or final_row.side_b_source_match_id is not null then
        raise exception 'Copo_3 final lado B invalido';
      end if;
    elsif grp.topology = 'semi_4' then
      if match_count <> 3 then raise exception 'Grupo % deve ter duas semis e final', grp.label; end if;
      select id into sf1 from public.bracket_matches
       where group_id = grp.id and round = 'semifinal' and pair_index = 1;
      select id into sf2 from public.bracket_matches
       where group_id = grp.id and round = 'semifinal' and pair_index = 2;
      select * into sf_row from public.bracket_matches where id = sf1;
      select slot into entry_slot from public.bracket_entries where id = sf_row.side_a_entry_id;
      if entry_slot <> 1 then raise exception 'Semi_4 SF1 lado A invalido'; end if;
      select slot into entry_slot from public.bracket_entries where id = sf_row.side_b_entry_id;
      if entry_slot <> 3 then raise exception 'Semi_4 SF1 lado B invalido'; end if;
      select * into sf_row from public.bracket_matches where id = sf2;
      select slot into entry_slot from public.bracket_entries where id = sf_row.side_a_entry_id;
      if entry_slot <> 2 then raise exception 'Semi_4 SF2 lado A invalido'; end if;
      select slot into entry_slot from public.bracket_entries where id = sf_row.side_b_entry_id;
      if entry_slot <> 4 then raise exception 'Semi_4 SF2 lado B invalido'; end if;
      select * into final_row
        from public.bracket_matches
       where group_id = grp.id and round = 'final' and pair_index = 1;
      if final_row.side_a_source_match_id is distinct from sf1
         or final_row.side_b_source_match_id is distinct from sf2
         or final_row.side_a_entry_id is not null
         or final_row.side_b_entry_id is not null then
        raise exception 'Semi_4 final invalida';
      end if;
    end if;
  end loop;
end;
$fn$;

create or replace function public.bracket_same_team_warnings(target_bracket_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  warnings jsonb := '[]'::jsonb;
  grp public.bracket_groups%rowtype;
  team_of uuid[];
  slot_idx integer;
begin
  for grp in
    select * from public.bracket_groups
     where bracket_id = target_bracket_id
     order by sort_order
  loop
    team_of := array[null, null, null, null];
    for slot_idx in 1..public.bracket_topology_size(grp.topology) loop
      select p.team_id into team_of[slot_idx]
        from public.bracket_entries e
        join public.bracket_participants p on p.id = e.participant_id
       where e.group_id = grp.id and e.slot = slot_idx;
    end loop;

    if grp.topology = 'final_2'
       and team_of[1] is not null and team_of[1] = team_of[2] then
      warnings := warnings || jsonb_build_array(jsonb_build_object(
        'type', 'same_team', 'group', grp.label, 'slots', jsonb_build_array(1, 2), 'teamId', team_of[1]
      ));
    end if;
    if grp.topology = 'copo_3'
       and team_of[1] is not null and team_of[1] = team_of[3] then
      warnings := warnings || jsonb_build_array(jsonb_build_object(
        'type', 'same_team', 'group', grp.label, 'slots', jsonb_build_array(1, 3), 'teamId', team_of[1]
      ));
    end if;
    if grp.topology = 'semi_4' then
      if team_of[1] is not null and team_of[1] = team_of[3] then
        warnings := warnings || jsonb_build_array(jsonb_build_object(
          'type', 'same_team', 'group', grp.label, 'slots', jsonb_build_array(1, 3), 'teamId', team_of[1]
        ));
      end if;
      if team_of[2] is not null and team_of[2] = team_of[4] then
        warnings := warnings || jsonb_build_array(jsonb_build_object(
          'type', 'same_team', 'group', grp.label, 'slots', jsonb_build_array(2, 4), 'teamId', team_of[2]
        ));
      end if;
    end if;
  end loop;
  return warnings;
end;
$fn$;

create or replace function public.category_bracket_to_json(target_bracket_id uuid, result_kind text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  bracket_row public.category_brackets%rowtype;
begin
  select * into bracket_row from public.category_brackets where id = target_bracket_id;
  if not found then raise exception 'Chave inexistente'; end if;
  return jsonb_build_object(
    'kind', result_kind,
    'bracketId', bracket_row.id,
    'eventId', bracket_row.event_id,
    'categoryId', bracket_row.category_id,
    'version', bracket_row.version,
    'mode', bracket_row.mode,
    'status', bracket_row.status,
    'warnings', public.bracket_same_team_warnings(target_bracket_id)
  );
end;
$fn$;

create or replace function public.replace_bracket_composition(
  target_bracket_id uuid,
  groups_payload jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  bracket_row public.category_brackets%rowtype;
  groups_json jsonb;
  group_el jsonb;
  slots_json jsonb;
  slot_el jsonb;
  sort_idx integer := 0;
  new_group_id uuid;
  topology public.bracket_topology;
  expected integer;
  slot_no integer;
  participant uuid;
  seen uuid[] := '{}';
  labels_seen text[] := '{}';
  group_label text;
  grp public.bracket_groups%rowtype;
  participant_count integer;
  slot_flags boolean[];
  slot_idx integer;
begin
  select * into bracket_row from public.category_brackets where id = target_bracket_id;
  if not found then raise exception 'Chave inexistente'; end if;
  if bracket_row.mode <> 'competicao' then
    raise exception 'Composicao manual indisponivel para categoria sem confronto';
  end if;

  if jsonb_typeof(groups_payload) = 'array' then
    groups_json := groups_payload;
  else
    groups_json := coalesce(groups_payload->'groups', '[]'::jsonb);
  end if;
  if jsonb_typeof(groups_json) is distinct from 'array' or jsonb_array_length(groups_json) < 1 then
    raise exception 'Informe ao menos um grupo';
  end if;

  perform public.clear_bracket_composition(target_bracket_id);

  for group_el in select value from jsonb_array_elements(groups_json)
  loop
    begin
      topology := (group_el->>'topology')::public.bracket_topology;
    exception when invalid_text_representation then
      raise exception 'Topologia invalida';
    end;
    expected := public.bracket_topology_size(topology);
    slots_json := coalesce(group_el->'slots', '[]'::jsonb);
    if jsonb_typeof(slots_json) is distinct from 'array' or jsonb_array_length(slots_json) <> expected then
      raise exception 'Grupo com slots incompativeis com a topologia';
    end if;
    group_label := coalesce(nullif(upper(trim(group_el->>'label')), ''), chr(65 + sort_idx));
    if group_label !~ '^[A-Z]$' then raise exception 'Rotulo de grupo invalido'; end if;
    if group_label = any(labels_seen) then raise exception 'Rotulo de grupo duplicado'; end if;
    labels_seen := array_append(labels_seen, group_label);

    insert into public.bracket_groups (bracket_id, label, sort_order, topology)
    values (target_bracket_id, group_label, sort_idx, topology)
    returning id into new_group_id;

    slot_flags := array_fill(false, array[expected]);

    for slot_el in select value from jsonb_array_elements(slots_json)
    loop
      slot_no := (slot_el->>'slot')::integer;
      participant := coalesce(
        nullif(slot_el->>'participant_id', ''),
        nullif(slot_el->>'participantId', '')
      )::uuid;
      if participant is null then raise exception 'Participante obrigatorio no slot'; end if;
      if participant = any(seen) then raise exception 'Participante duplicado na composicao'; end if;
      if not exists (
        select 1 from public.bracket_participants p
         where p.id = participant and p.bracket_id = target_bracket_id
      ) then
        raise exception 'Participante fora da chave';
      end if;
      if slot_no is null or slot_no < 1 or slot_no > expected then
        raise exception 'Slot invalido para a topologia';
      end if;
      if slot_flags[slot_no] then raise exception 'Slot duplicado no grupo'; end if;
      slot_flags[slot_no] := true;
      insert into public.bracket_entries (bracket_id, group_id, participant_id, slot)
      values (target_bracket_id, new_group_id, participant, slot_no);
      seen := array_append(seen, participant);
    end loop;
    for slot_idx in 1..expected loop
      if slot_flags[slot_idx] is not true then
        raise exception 'Grupo com slots incompletos';
      end if;
    end loop;
    sort_idx := sort_idx + 1;
  end loop;

  select count(*) into participant_count
    from public.bracket_participants where bracket_id = target_bracket_id;
  if coalesce(array_length(seen, 1), 0) <> participant_count then
    raise exception 'A composicao deve cobrir exatamente os participantes congelados';
  end if;

  for grp in select * from public.bracket_groups where bracket_id = target_bracket_id
  loop
    perform public.insert_group_matches(grp.id);
  end loop;
end;
$fn$;

create or replace function public.freeze_bracket_participants(
  target_bracket_id uuid,
  target_event_id uuid,
  target_category_id uuid
)
returns integer
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  inserted integer;
begin
  if exists (
    select 1
      from public.registrations registration
     where registration.event_id = target_event_id
       and registration.status = 'efetivada'
       and coalesce(registration.current_category_id, registration.category_id) = target_category_id
       and nullif(trim(registration.athlete_snapshot->>'nome_completo'), '') is null
  ) then
    raise exception 'Snapshot de atleta incompleto';
  end if;

  insert into public.bracket_participants (
    bracket_id, registration_id, athlete_id, nome_exibido, team_id, team_name, source_order
  )
  select
    target_bracket_id,
    registration.id,
    registration.athlete_id,
    trim(registration.athlete_snapshot->>'nome_completo'),
    nullif(registration.athlete_snapshot->>'team_id', '')::uuid,
    nullif(trim(registration.athlete_snapshot->>'team_name'), ''),
    row_number() over (order by registration.numero, registration.id)::integer
  from public.registrations registration
  where registration.event_id = target_event_id
    and registration.status = 'efetivada'
    and coalesce(registration.current_category_id, registration.category_id) = target_category_id;

  get diagnostics inserted = row_count;
  return inserted;
end;
$fn$;

create or replace function public.copy_bracket_participants(
  source_bracket_id uuid,
  target_bracket_id uuid
)
returns integer
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  inserted integer;
begin
  insert into public.bracket_participants (
    bracket_id, registration_id, athlete_id, nome_exibido, team_id, team_name, source_order
  )
  select
    target_bracket_id,
    registration_id,
    athlete_id,
    nome_exibido,
    team_id,
    team_name,
    source_order
  from public.bracket_participants
  where bracket_id = source_bracket_id
  order by source_order, id;
  get diagnostics inserted = row_count;
  return inserted;
end;
$fn$;

create or replace function public.generate_category_bracket(
  target_event_id uuid,
  target_category_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  actor uuid := auth.uid();
  target_event public.events%rowtype;
  existing public.category_brackets%rowtype;
  new_id uuid;
  next_version integer;
  athlete_count integer;
  new_mode public.bracket_mode;
begin
  if target_category_id is null then raise exception 'Categoria obrigatoria'; end if;
  perform public.category_bracket_lock(target_event_id, target_category_id);
  target_event := public.category_bracket_load_event(target_event_id);
  if not public.category_belongs_to_event(target_event_id, target_category_id) then
    raise exception 'Categoria nao pertence ao evento';
  end if;

  select * into existing
    from public.category_brackets
   where event_id = target_event_id
     and category_id = target_category_id
     and status = 'draft'
     for update;
  if found then
    return public.category_bracket_to_json(existing.id, 'existing_draft');
  end if;

  select coalesce(max(version), 0) + 1 into next_version
    from public.category_brackets
   where event_id = target_event_id
     and category_id = target_category_id;

  select count(*) into athlete_count
    from public.registrations registration
   where registration.event_id = target_event_id
     and registration.status = 'efetivada'
     and coalesce(registration.current_category_id, registration.category_id) = target_category_id;
  if athlete_count = 0 then
    raise exception 'Categoria sem inscricoes efetivadas';
  end if;
  new_mode := case when athlete_count = 1 then 'sem_confronto' else 'competicao' end;

  begin
    insert into public.category_brackets (
      event_id, category_id, version, mode, status,
      source_checagem_travada_em, generated_by
    ) values (
      target_event_id, target_category_id, next_version, new_mode, 'draft',
      target_event.checagem_travada_em, actor
    ) returning id into new_id;
  exception when unique_violation then
    raise exception 'Operacao concorrente na chave desta categoria';
  end;

  perform public.freeze_bracket_participants(new_id, target_event_id, target_category_id);
  perform public.apply_suggested_bracket_composition(new_id);
  perform public.assert_bracket_structure(new_id);

  insert into public.event_audit_logs (
    organization_id, event_id, actor_id, action, resource_type,
    resource_id, after_data
  ) values (
    target_event.organization_id, target_event.id, actor,
    'bracket_generated', 'category_bracket', new_id,
    public.category_bracket_to_json(new_id, 'draft')
  );

  return public.category_bracket_to_json(new_id, 'draft');
end;
$fn$;

create or replace function public.save_category_bracket_composition(
  target_bracket_id uuid,
  groups_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  actor uuid := auth.uid();
  bracket_row public.category_brackets%rowtype;
  target_event public.events%rowtype;
  before_payload jsonb;
begin
  if target_bracket_id is null then raise exception 'Chave obrigatoria'; end if;
  select * into bracket_row from public.category_brackets where id = target_bracket_id;
  if not found then raise exception 'Chave inexistente'; end if;

  perform public.category_bracket_lock(bracket_row.event_id, bracket_row.category_id);
  target_event := public.category_bracket_load_event(bracket_row.event_id);

  select * into bracket_row
    from public.category_brackets
   where id = target_bracket_id
     for update;
  if bracket_row.status <> 'draft' then
    raise exception 'Somente chave em rascunho pode ser editada';
  end if;
  if public.bracket_has_results(target_bracket_id) then
    raise exception 'Chave com resultado nao pode ser editada';
  end if;

  before_payload := public.category_bracket_to_json(target_bracket_id, 'draft');
  perform public.replace_bracket_composition(target_bracket_id, groups_payload);
  perform public.assert_bracket_structure(target_bracket_id);

  insert into public.event_audit_logs (
    organization_id, event_id, actor_id, action, resource_type,
    resource_id, before_data, after_data
  ) values (
    target_event.organization_id, target_event.id, actor,
    'bracket_composition_saved', 'category_bracket', target_bracket_id,
    before_payload,
    public.category_bracket_to_json(target_bracket_id, 'draft')
  );

  return public.category_bracket_to_json(target_bracket_id, 'saved');
end;
$fn$;

create or replace function public.restore_category_bracket_suggestion(target_bracket_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  actor uuid := auth.uid();
  bracket_row public.category_brackets%rowtype;
  target_event public.events%rowtype;
  before_payload jsonb;
begin
  if target_bracket_id is null then raise exception 'Chave obrigatoria'; end if;
  select * into bracket_row from public.category_brackets where id = target_bracket_id;
  if not found then raise exception 'Chave inexistente'; end if;

  perform public.category_bracket_lock(bracket_row.event_id, bracket_row.category_id);
  target_event := public.category_bracket_load_event(bracket_row.event_id);

  select * into bracket_row
    from public.category_brackets
   where id = target_bracket_id
     for update;
  if bracket_row.status <> 'draft' then
    raise exception 'Somente chave em rascunho pode ser restaurada';
  end if;
  if public.bracket_has_results(target_bracket_id) then
    raise exception 'Chave com resultado nao pode ser editada';
  end if;

  before_payload := public.category_bracket_to_json(target_bracket_id, 'draft');
  perform public.apply_suggested_bracket_composition(target_bracket_id);
  perform public.assert_bracket_structure(target_bracket_id);

  insert into public.event_audit_logs (
    organization_id, event_id, actor_id, action, resource_type,
    resource_id, before_data, after_data
  ) values (
    target_event.organization_id, target_event.id, actor,
    'bracket_suggestion_restored', 'category_bracket', target_bracket_id,
    before_payload,
    public.category_bracket_to_json(target_bracket_id, 'draft')
  );

  return public.category_bracket_to_json(target_bracket_id, 'restored');
end;
$fn$;

create or replace function public.publish_category_bracket(target_bracket_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  actor uuid := auth.uid();
  bracket_row public.category_brackets%rowtype;
  target_event public.events%rowtype;
  live_id uuid;
begin
  if target_bracket_id is null then raise exception 'Chave obrigatoria'; end if;
  select * into bracket_row from public.category_brackets where id = target_bracket_id;
  if not found then raise exception 'Chave inexistente'; end if;

  perform public.category_bracket_lock(bracket_row.event_id, bracket_row.category_id);
  target_event := public.category_bracket_load_event(bracket_row.event_id);

  select * into bracket_row
    from public.category_brackets
   where id = target_bracket_id
     for update;
  if bracket_row.status <> 'draft' then
    raise exception 'Somente chave em rascunho pode ser publicada';
  end if;
  if public.bracket_has_results(target_bracket_id) then
    raise exception 'Chave com resultado nao pode ser publicada neste estado';
  end if;
  perform public.assert_bracket_structure(target_bracket_id);

  select id into live_id
    from public.category_brackets
   where event_id = bracket_row.event_id
     and category_id = bracket_row.category_id
     and status in ('publicada', 'em_andamento', 'concluida')
     for update;
  if live_id is not null then
    if public.bracket_has_results(live_id) then
      raise exception 'Versao publicada com resultado nao pode ser substituida';
    end if;
    update public.category_brackets
       set status = 'substituida', updated_at = now()
     where id = live_id;
  end if;

  begin
    update public.category_brackets
       set status = 'publicada',
           published_by = actor,
           published_at = now(),
           updated_at = now()
     where id = target_bracket_id;
  exception when unique_violation then
    raise exception 'Operacao concorrente na chave desta categoria';
  end;

  insert into public.event_audit_logs (
    organization_id, event_id, actor_id, action, resource_type,
    resource_id, after_data
  ) values (
    target_event.organization_id, target_event.id, actor,
    'bracket_published', 'category_bracket', target_bracket_id,
    public.category_bracket_to_json(target_bracket_id, 'publicada')
  );

  return public.category_bracket_to_json(target_bracket_id, 'publicada');
end;
$fn$;

create or replace function public.regenerate_category_bracket(
  target_bracket_id uuid,
  reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  actor uuid := auth.uid();
  source_row public.category_brackets%rowtype;
  target_event public.events%rowtype;
  existing_draft uuid;
  new_id uuid;
  next_version integer;
  trimmed_reason text := nullif(trim(reason), '');
begin
  if target_bracket_id is null then raise exception 'Chave obrigatoria'; end if;
  if trimmed_reason is null or length(trimmed_reason) < 5 then
    raise exception 'Motivo obrigatorio para regenerar a chave';
  end if;

  select * into source_row from public.category_brackets where id = target_bracket_id;
  if not found then raise exception 'Chave inexistente'; end if;

  perform public.category_bracket_lock(source_row.event_id, source_row.category_id);
  target_event := public.category_bracket_load_event(source_row.event_id);

  select * into source_row
    from public.category_brackets
   where id = target_bracket_id
     for update;
  if source_row.status not in ('publicada', 'em_andamento', 'concluida') then
    raise exception 'Somente chave publicada pode ser regenerada';
  end if;
  if public.bracket_has_results(source_row.id) then
    raise exception 'Chave com resultado nao pode ser regenerada';
  end if;

  select id into existing_draft
    from public.category_brackets
   where event_id = source_row.event_id
     and category_id = source_row.category_id
     and status = 'draft'
     for update;
  if existing_draft is not null then
    raise exception 'Ja existe rascunho para esta categoria';
  end if;

  select coalesce(max(version), 0) + 1 into next_version
    from public.category_brackets
   where event_id = source_row.event_id
     and category_id = source_row.category_id;

  begin
    insert into public.category_brackets (
      event_id, category_id, version, mode, status,
      source_checagem_travada_em, generated_by, supersedes_id, regeneration_reason
    ) values (
      source_row.event_id, source_row.category_id, next_version, source_row.mode, 'draft',
      source_row.source_checagem_travada_em, actor, source_row.id, trimmed_reason
    ) returning id into new_id;
  exception when unique_violation then
    raise exception 'Operacao concorrente na chave desta categoria';
  end;

  perform public.copy_bracket_participants(source_row.id, new_id);
  perform public.apply_suggested_bracket_composition(new_id);
  perform public.assert_bracket_structure(new_id);

  insert into public.event_audit_logs (
    organization_id, event_id, actor_id, action, resource_type,
    resource_id, before_data, after_data, reason
  ) values (
    target_event.organization_id, target_event.id, actor,
    'bracket_regenerated', 'category_bracket', new_id,
    jsonb_build_object('sourceBracketId', source_row.id, 'sourceVersion', source_row.version),
    public.category_bracket_to_json(new_id, 'draft'),
    trimmed_reason
  );

  return public.category_bracket_to_json(new_id, 'regenerated');
end;
$fn$;

revoke execute on function public.protect_bracket_participants() from public, anon, authenticated;
revoke execute on function public.category_bracket_lock(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.category_bracket_require_staff(public.events) from public, anon, authenticated;
revoke execute on function public.category_bracket_load_event(uuid) from public, anon, authenticated;
revoke execute on function public.category_belongs_to_event(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.bracket_topology_size(public.bracket_topology) from public, anon, authenticated;
revoke execute on function public.bracket_partition_sizes(integer) from public, anon, authenticated;
revoke execute on function public.bracket_has_results(uuid) from public, anon, authenticated;
revoke execute on function public.clear_bracket_composition(uuid) from public, anon, authenticated;
revoke execute on function public.insert_group_matches(uuid) from public, anon, authenticated;
revoke execute on function public.insert_group_entries(uuid, uuid, uuid[]) from public, anon, authenticated;
revoke execute on function public.apply_suggested_bracket_composition(uuid) from public, anon, authenticated;
revoke execute on function public.assert_bracket_structure(uuid) from public, anon, authenticated;
revoke execute on function public.bracket_same_team_warnings(uuid) from public, anon, authenticated;
revoke execute on function public.category_bracket_to_json(uuid, text) from public, anon, authenticated;
revoke execute on function public.replace_bracket_composition(uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.freeze_bracket_participants(uuid, uuid, uuid) from public, anon, authenticated;
revoke execute on function public.copy_bracket_participants(uuid, uuid) from public, anon, authenticated;

revoke all on function public.generate_category_bracket(uuid, uuid) from public, anon;
revoke all on function public.save_category_bracket_composition(uuid, jsonb) from public, anon;
revoke all on function public.restore_category_bracket_suggestion(uuid) from public, anon;
revoke all on function public.publish_category_bracket(uuid) from public, anon;
revoke all on function public.regenerate_category_bracket(uuid, text) from public, anon;

grant execute on function public.generate_category_bracket(uuid, uuid) to authenticated;
grant execute on function public.save_category_bracket_composition(uuid, jsonb) to authenticated;
grant execute on function public.restore_category_bracket_suggestion(uuid) to authenticated;
grant execute on function public.publish_category_bracket(uuid) to authenticated;
grant execute on function public.regenerate_category_bracket(uuid, text) to authenticated;

commit;
