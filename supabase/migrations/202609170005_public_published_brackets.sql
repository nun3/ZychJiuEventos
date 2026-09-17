-- Sprint 8: projecao publica minima das chaves oficiais.
-- Nao concede SELECT anonimo nas tabelas e nao retorna IDs internos.
begin;

create or replace function public.get_public_event_brackets(target_event_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  result jsonb;
begin
  if target_event_id is null or not exists (
    select 1
      from public.events event_row
     where event_row.id = target_event_id
       and event_row.status in (
         'publicado',
         'inscricao',
         'pagamento',
         'checagem',
         'chaves',
         'em_andamento',
         'concluido'
       )
  ) then
    return '[]'::jsonb;
  end if;

  select coalesce(jsonb_agg(safe_bracket.payload order by safe_bracket.category_name), '[]'::jsonb)
    into result
    from (
      select
        category.nome as category_name,
        jsonb_build_object(
          'category', category.nome,
          'mode', bracket.mode,
          'status', 'publicada',
          'athlete',
            case
              when bracket.mode = 'sem_confronto' then (
                select jsonb_build_object(
                  'name', participant.nome_exibido,
                  'team', participant.team_name
                )
                  from public.bracket_participants participant
                 where participant.bracket_id = bracket.id
                 order by participant.source_order
                 limit 1
              )
              else null
            end,
          'groups',
            case
              when bracket.mode = 'sem_confronto' then '[]'::jsonb
              else coalesce((
                select jsonb_agg(
                  jsonb_build_object(
                    'label', bracket_group.label,
                    'topology', bracket_group.topology,
                    'slots', coalesce((
                      select jsonb_agg(
                        jsonb_build_object(
                          'position', entry.slot,
                          'role', case
                            when bracket_group.topology = 'copo_3' and entry.slot = 2 then 'copo'
                            else 'chave'
                          end,
                          'athlete', participant.nome_exibido,
                          'team', participant.team_name
                        )
                        order by entry.slot
                      )
                        from public.bracket_entries entry
                        join public.bracket_participants participant
                          on participant.id = entry.participant_id
                       where entry.group_id = bracket_group.id
                    ), '[]'::jsonb),
                    'matches', coalesce((
                      select jsonb_agg(
                        jsonb_build_object(
                          'round', bracket_match.round,
                          'order', bracket_match.pair_index,
                          'sideA', coalesce(
                            (
                              select participant.nome_exibido
                                from public.bracket_entries entry
                                join public.bracket_participants participant
                                  on participant.id = entry.participant_id
                               where entry.id = bracket_match.side_a_entry_id
                            ),
                            (
                              select 'Vencedor da semifinal ' || source_match.pair_index::text
                                from public.bracket_matches source_match
                               where source_match.id = bracket_match.side_a_source_match_id
                            )
                          ),
                          'sideB', coalesce(
                            (
                              select participant.nome_exibido
                                from public.bracket_entries entry
                                join public.bracket_participants participant
                                  on participant.id = entry.participant_id
                               where entry.id = bracket_match.side_b_entry_id
                            ),
                            (
                              select 'Vencedor da semifinal ' || source_match.pair_index::text
                                from public.bracket_matches source_match
                               where source_match.id = bracket_match.side_b_source_match_id
                            )
                          )
                        )
                        order by
                          case bracket_match.round when 'semifinal' then 1 else 2 end,
                          bracket_match.pair_index
                      )
                        from public.bracket_matches bracket_match
                       where bracket_match.group_id = bracket_group.id
                    ), '[]'::jsonb)
                  )
                  order by bracket_group.sort_order
                )
                  from public.bracket_groups bracket_group
                 where bracket_group.bracket_id = bracket.id
              ), '[]'::jsonb)
            end
        ) as payload
      from public.category_brackets bracket
      join public.event_categories category on category.id = bracket.category_id
      where bracket.event_id = target_event_id
        and bracket.status = 'publicada'
    ) safe_bracket;

  return result;
end;
$fn$;

revoke all on function public.get_public_event_brackets(uuid) from public;
grant execute on function public.get_public_event_brackets(uuid) to anon, authenticated;

commit;
