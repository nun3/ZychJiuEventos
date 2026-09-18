-- Sprint 9 Lote 2: projecao publica da programacao oficial.
-- Nao altera o dominio de areas/numeracao e nao concede SELECT anonimo nas tabelas administrativas.
begin;

create or replace function public.public_schedule_side_to_json(
  target_match_id uuid,
  target_side text
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  resolved_entry uuid;
  athlete jsonb;
  source_match uuid;
  source_number integer;
begin
  resolved_entry := public.bracket_resolve_match_side(target_match_id, target_side);
  if resolved_entry is not null then
    athlete := public.bracket_entry_to_json(resolved_entry, false);
    if athlete is not null then
      return athlete || jsonb_build_object('resolved', true);
    end if;
  end if;

  select case
           when target_side = 'A' then bracket_match.side_a_source_match_id
           else bracket_match.side_b_source_match_id
         end
    into source_match
    from public.bracket_matches bracket_match
   where bracket_match.id = target_match_id;

  if source_match is not null then
    select scheduled.fight_number
      into source_number
      from public.event_schedule_matches scheduled
     where scheduled.match_id = source_match;
    if source_number is not null then
      return jsonb_build_object(
        'name', 'Vencedor da luta ' || source_number::text,
        'team', null,
        'resolved', false
      );
    end if;
  end if;

  return jsonb_build_object('name', 'A definir', 'team', null, 'resolved', false);
end;
$fn$;

create or replace function public.get_public_event_schedule(target_event_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  matches_payload jsonb;
begin
  if target_event_id is null or not exists (
    select 1
      from public.events event_row
      join public.event_schedules schedule on schedule.event_id = event_row.id
     where event_row.id = target_event_id
       and event_row.status in (
         'publicado', 'inscricao', 'pagamento', 'checagem',
         'chaves', 'em_andamento', 'concluido'
       )
       and schedule.status = 'publicada'
  ) then
    return jsonb_build_object(
      'kind', 'public_schedule',
      'matches', '[]'::jsonb
    );
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'fightNumber', scheduled.fight_number,
      'areaNumber', area.number,
      'areaName', area.name,
      'category', category.nome,
      'groupLabel', bracket_group.label,
      'round', bracket_match.round,
      'order', bracket_match.pair_index,
      'status', bracket_match.status,
      'sideA', public.public_schedule_side_to_json(bracket_match.id, 'A'),
      'sideB', public.public_schedule_side_to_json(bracket_match.id, 'B'),
      'winner', public.bracket_entry_to_json(bracket_match.winner_entry_id, false)->>'name',
      'isWalkover', bracket_match.status = 'wo'
    )
    order by scheduled.fight_number
  ), '[]'::jsonb)
    into matches_payload
    from public.event_schedule_matches scheduled
    join public.event_schedules schedule on schedule.id = scheduled.schedule_id
    join public.bracket_matches bracket_match on bracket_match.id = scheduled.match_id
    join public.bracket_groups bracket_group on bracket_group.id = bracket_match.group_id
    join public.event_schedule_groups assignment
      on assignment.group_id = bracket_group.id
     and assignment.schedule_id = schedule.id
    join public.event_areas area on area.id = assignment.area_id
    join public.category_brackets bracket on bracket.id = bracket_group.bracket_id
    join public.event_categories category on category.id = bracket.category_id
   where schedule.event_id = target_event_id
     and schedule.status = 'publicada'
     and bracket.mode = 'competicao'
     and bracket.status in ('publicada', 'em_andamento', 'concluida');

  return jsonb_build_object(
    'kind', 'public_schedule',
    'matches', matches_payload
  );
end;
$fn$;

revoke execute on function public.public_schedule_side_to_json(uuid, text)
from public, anon, authenticated;

revoke all on function public.get_public_event_schedule(uuid) from public;
grant execute on function public.get_public_event_schedule(uuid) to anon, authenticated;

commit;
