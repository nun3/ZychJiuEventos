-- Sprint 8: SELECT INTO nao aceita alvo com indice de array.
-- O parser interpretava team_id[slot_idx] e falhava com uuid.
begin;

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
  slot_team uuid;
begin
  for grp in
    select * from public.bracket_groups
     where bracket_id = target_bracket_id
     order by sort_order
  loop
    team_of := array[null, null, null, null];
    for slot_idx in 1..public.bracket_topology_size(grp.topology) loop
      select p.team_id into slot_team
        from public.bracket_entries e
        join public.bracket_participants p on p.id = e.participant_id
       where e.group_id = grp.id and e.slot = slot_idx;
      team_of[slot_idx] := slot_team;
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

revoke execute on function public.bracket_same_team_warnings(uuid) from public, anon, authenticated;

commit;
