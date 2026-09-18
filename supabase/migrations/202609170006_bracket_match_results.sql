-- Sprint 8: operacao de resultados e WO sobre chaves publicadas.
-- Avanco e colocacoes sao derivados do grafo persistido; a topologia nao e reescrita.
begin;

alter table public.bracket_matches
  add constraint bracket_matches_result_state
  check (
    (status = 'pendente' and winner_entry_id is null)
    or (status in ('concluido', 'wo') and winner_entry_id is not null)
  );

create or replace function public.protect_bracket_match_result()
returns trigger
language plpgsql
set search_path = ''
as $fn$
begin
  if new.status is not distinct from old.status
     and new.winner_entry_id is not distinct from old.winner_entry_id then
    return new;
  end if;
  if current_setting('jiu.allow_bracket_result', true) is distinct from '1' then
    raise exception 'Resultado de confronto so pode ser alterado pela operacao autorizada';
  end if;
  return new;
end;
$fn$;

drop trigger if exists bracket_match_result_guard on public.bracket_matches;
create trigger bracket_match_result_guard
before update of status, winner_entry_id on public.bracket_matches
for each row execute function public.protect_bracket_match_result();

create or replace function public.bracket_resolve_match_side(
  target_match_id uuid,
  target_side text
)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  match_row public.bracket_matches%rowtype;
  source_id uuid;
  direct_entry_id uuid;
  resolved_entry_id uuid;
begin
  select * into match_row
    from public.bracket_matches
   where id = target_match_id;
  if not found then raise exception 'Confronto inexistente'; end if;

  if upper(target_side) = 'A' then
    direct_entry_id := match_row.side_a_entry_id;
    source_id := match_row.side_a_source_match_id;
  elsif upper(target_side) = 'B' then
    direct_entry_id := match_row.side_b_entry_id;
    source_id := match_row.side_b_source_match_id;
  else
    raise exception 'Lado de confronto invalido';
  end if;

  if direct_entry_id is not null then return direct_entry_id; end if;

  select winner_entry_id into resolved_entry_id
    from public.bracket_matches
   where id = source_id
     and status in ('concluido', 'wo');
  return resolved_entry_id;
end;
$fn$;

create or replace function public.bracket_entry_to_json(
  target_entry_id uuid,
  include_internal_id boolean default false
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $fn$
  select case
    when target_entry_id is null then null
    else (
      select jsonb_strip_nulls(jsonb_build_object(
        'entryId', case when include_internal_id then entry.id else null end,
        'name', participant.nome_exibido,
        'team', participant.team_name
      ))
        from public.bracket_entries entry
        join public.bracket_participants participant on participant.id = entry.participant_id
       where entry.id = target_entry_id
    )
  end;
$fn$;

create or replace function public.bracket_group_placements_to_json(
  target_group_id uuid,
  include_internal_ids boolean default false
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  grp public.bracket_groups%rowtype;
  final_match public.bracket_matches%rowtype;
  semifinal_match public.bracket_matches%rowtype;
  winner_id uuid;
  loser_id uuid;
  result jsonb := '[]'::jsonb;
begin
  select * into grp from public.bracket_groups where id = target_group_id;
  if not found then raise exception 'Grupo inexistente'; end if;

  select * into final_match
    from public.bracket_matches
   where group_id = target_group_id
     and round = 'final'
     and pair_index = 1;
  if not found
     or final_match.status not in ('concluido', 'wo')
     or final_match.winner_entry_id is null then
    return result;
  end if;

  winner_id := final_match.winner_entry_id;
  loser_id := case
    when public.bracket_resolve_match_side(final_match.id, 'A') = winner_id
      then public.bracket_resolve_match_side(final_match.id, 'B')
    else public.bracket_resolve_match_side(final_match.id, 'A')
  end;

  result := result || jsonb_build_array(
    jsonb_build_object(
      'place', 1,
      'athlete', public.bracket_entry_to_json(winner_id, include_internal_ids)
    ),
    jsonb_build_object(
      'place', 2,
      'athlete', public.bracket_entry_to_json(loser_id, include_internal_ids)
    )
  );

  if grp.topology = 'copo_3' then
    select * into semifinal_match
      from public.bracket_matches
     where group_id = target_group_id
       and round = 'semifinal'
       and pair_index = 1;
    loser_id := case
      when public.bracket_resolve_match_side(semifinal_match.id, 'A') = semifinal_match.winner_entry_id
        then public.bracket_resolve_match_side(semifinal_match.id, 'B')
      else public.bracket_resolve_match_side(semifinal_match.id, 'A')
    end;
    result := result || jsonb_build_array(jsonb_build_object(
      'place', 3,
      'athlete', public.bracket_entry_to_json(loser_id, include_internal_ids)
    ));
  elsif grp.topology = 'semi_4' then
    for semifinal_match in
      select * from public.bracket_matches
       where group_id = target_group_id
         and round = 'semifinal'
       order by pair_index
    loop
      loser_id := case
        when public.bracket_resolve_match_side(semifinal_match.id, 'A') = semifinal_match.winner_entry_id
          then public.bracket_resolve_match_side(semifinal_match.id, 'B')
        else public.bracket_resolve_match_side(semifinal_match.id, 'A')
      end;
      result := result || jsonb_build_array(jsonb_build_object(
        'place', 3,
        'athlete', public.bracket_entry_to_json(loser_id, include_internal_ids)
      ));
    end loop;
  end if;

  return result;
end;
$fn$;

create or replace function public.category_bracket_operation_to_json(target_bracket_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  bracket_row public.category_brackets%rowtype;
  category_name text;
  groups_payload jsonb;
begin
  select * into bracket_row
    from public.category_brackets
   where id = target_bracket_id;
  if not found then raise exception 'Chave inexistente'; end if;
  select nome into category_name
    from public.event_categories
   where id = bracket_row.category_id;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'groupId', bracket_group.id,
      'label', bracket_group.label,
      'topology', bracket_group.topology,
      'status', case
        when exists (
          select 1 from public.bracket_matches pending_match
           where pending_match.group_id = bracket_group.id
             and pending_match.status = 'pendente'
        ) then case when bracket_row.status = 'publicada' then 'aguardando' else 'em_andamento' end
        else 'concluido'
      end,
      'matches', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'matchId', bracket_match.id,
            'round', bracket_match.round,
            'order', bracket_match.pair_index,
            'status', bracket_match.status,
            'sideA', public.bracket_entry_to_json(
              public.bracket_resolve_match_side(bracket_match.id, 'A'),
              true
            ),
            'sideB', public.bracket_entry_to_json(
              public.bracket_resolve_match_side(bracket_match.id, 'B'),
              true
            ),
            'winnerEntryId', bracket_match.winner_entry_id,
            'canRecord', (
              bracket_row.status = 'em_andamento'
              and bracket_match.status = 'pendente'
              and public.bracket_resolve_match_side(bracket_match.id, 'A') is not null
              and public.bracket_resolve_match_side(bracket_match.id, 'B') is not null
            )
          )
          order by
            case bracket_match.round when 'semifinal' then 1 else 2 end,
            bracket_match.pair_index
        )
          from public.bracket_matches bracket_match
         where bracket_match.group_id = bracket_group.id
      ), '[]'::jsonb),
      'placements', public.bracket_group_placements_to_json(bracket_group.id, true)
    )
    order by bracket_group.sort_order
  ), '[]'::jsonb)
    into groups_payload
    from public.bracket_groups bracket_group
   where bracket_group.bracket_id = target_bracket_id;

  return jsonb_build_object(
    'kind', 'operation',
    'bracketId', bracket_row.id,
    'eventId', bracket_row.event_id,
    'categoryId', bracket_row.category_id,
    'category', category_name,
    'version', bracket_row.version,
    'mode', bracket_row.mode,
    'status', bracket_row.status,
    'groups', groups_payload
  );
end;
$fn$;

create or replace function public.get_category_bracket_operation(target_bracket_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  target_event public.events%rowtype;
begin
  select event_row.* into target_event
    from public.category_brackets bracket
    join public.events event_row on event_row.id = bracket.event_id
   where bracket.id = target_bracket_id;
  if not found then raise exception 'Chave inexistente'; end if;
  perform public.category_bracket_require_staff(target_event);
  return public.category_bracket_operation_to_json(target_bracket_id);
end;
$fn$;

create or replace function public.start_category_bracket(target_bracket_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  bracket_row public.category_brackets%rowtype;
  target_event public.events%rowtype;
  actor uuid := auth.uid();
begin
  if target_bracket_id is null then raise exception 'Chave obrigatoria'; end if;
  select * into bracket_row from public.category_brackets where id = target_bracket_id;
  if not found then raise exception 'Chave inexistente'; end if;

  perform public.category_bracket_lock(bracket_row.event_id, bracket_row.category_id);
  select * into target_event from public.events where id = bracket_row.event_id for update;
  perform public.category_bracket_require_staff(target_event);

  select * into bracket_row from public.category_brackets where id = target_bracket_id for update;
  if bracket_row.mode <> 'competicao' then
    raise exception 'Categoria sem confronto nao possui operacao';
  end if;
  if bracket_row.status <> 'publicada' then
    raise exception 'Somente chave publicada pode iniciar operacao';
  end if;
  if target_event.checagem_travada_em is null then
    raise exception 'Checagem ainda nao travada';
  end if;
  if target_event.status not in ('chaves', 'em_andamento') then
    raise exception 'Evento fora da fase de resultados';
  end if;

  if target_event.status = 'chaves' then
    update public.events set status = 'em_andamento' where id = target_event.id;
  end if;
  update public.category_brackets
     set status = 'em_andamento', updated_at = now()
   where id = bracket_row.id;

  insert into public.event_audit_logs (
    organization_id, event_id, actor_id, action, resource_type,
    resource_id, after_data
  ) values (
    target_event.organization_id, target_event.id, actor,
    'bracket_operation_started', 'category_bracket', bracket_row.id,
    jsonb_build_object('status', 'em_andamento', 'version', bracket_row.version)
  );

  return public.category_bracket_operation_to_json(bracket_row.id);
end;
$fn$;

create or replace function public.record_bracket_match_outcome(
  target_match_id uuid,
  target_winner_entry_id uuid,
  outcome public.match_status
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  match_row public.bracket_matches%rowtype;
  bracket_row public.category_brackets%rowtype;
  target_event public.events%rowtype;
  side_a uuid;
  side_b uuid;
  actor uuid := auth.uid();
begin
  if target_match_id is null then raise exception 'Confronto obrigatorio'; end if;
  if target_winner_entry_id is null then raise exception 'Vencedor obrigatorio'; end if;
  if outcome is null or outcome not in ('concluido', 'wo') then raise exception 'Tipo de resultado invalido'; end if;

  select bracket.* into bracket_row
    from public.bracket_matches bracket_match
    join public.bracket_groups bracket_group on bracket_group.id = bracket_match.group_id
    join public.category_brackets bracket on bracket.id = bracket_group.bracket_id
   where bracket_match.id = target_match_id;
  if not found then raise exception 'Confronto inexistente'; end if;

  perform public.category_bracket_lock(bracket_row.event_id, bracket_row.category_id);
  select * into target_event from public.events where id = bracket_row.event_id for update;
  perform public.category_bracket_require_staff(target_event);

  select bracket.* into bracket_row
    from public.category_brackets bracket
   where bracket.id = bracket_row.id
   for update;
  select * into match_row
    from public.bracket_matches
   where id = target_match_id
   for update;

  if target_event.status <> 'em_andamento' or bracket_row.status <> 'em_andamento' then
    raise exception 'Chave fora de operacao';
  end if;
  if match_row.status <> 'pendente' or match_row.winner_entry_id is not null then
    raise exception 'Confronto ja possui resultado';
  end if;

  side_a := public.bracket_resolve_match_side(match_row.id, 'A');
  side_b := public.bracket_resolve_match_side(match_row.id, 'B');
  if side_a is null or side_b is null then
    raise exception 'Confronto ainda sem os dois lados resolvidos';
  end if;
  if target_winner_entry_id <> side_a and target_winner_entry_id <> side_b then
    raise exception 'Vencedor nao pertence ao confronto';
  end if;

  perform set_config('jiu.allow_bracket_result', '1', true);
  update public.bracket_matches
     set status = outcome,
         winner_entry_id = target_winner_entry_id
   where id = match_row.id;
  perform set_config('jiu.allow_bracket_result', '0', true);

  if not exists (
    select 1
      from public.bracket_matches remaining_match
      join public.bracket_groups bracket_group on bracket_group.id = remaining_match.group_id
     where bracket_group.bracket_id = bracket_row.id
       and remaining_match.status = 'pendente'
  ) then
    update public.category_brackets
       set status = 'concluida', updated_at = now()
     where id = bracket_row.id;
  end if;

  insert into public.event_audit_logs (
    organization_id, event_id, actor_id, action, resource_type,
    resource_id, after_data
  ) values (
    target_event.organization_id, target_event.id, actor,
    'bracket_match_outcome_recorded', 'bracket_match', match_row.id,
    jsonb_build_object(
      'bracketId', bracket_row.id,
      'matchId', match_row.id,
      'outcome', outcome,
      'winnerEntryId', target_winner_entry_id
    )
  );

  return public.category_bracket_operation_to_json(bracket_row.id);
end;
$fn$;

create or replace function public.public_category_bracket_to_json(target_bracket_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  bracket_row public.category_brackets%rowtype;
  category_name text;
  single_athlete jsonb;
  groups_payload jsonb;
begin
  select * into bracket_row
    from public.category_brackets
   where id = target_bracket_id
     and status in ('publicada', 'em_andamento', 'concluida');
  if not found then return null; end if;
  select nome into category_name
    from public.event_categories
   where id = bracket_row.category_id;

  if bracket_row.mode = 'sem_confronto' then
    select jsonb_build_object('name', participant.nome_exibido, 'team', participant.team_name)
      into single_athlete
      from public.bracket_participants participant
     where participant.bracket_id = bracket_row.id
     order by participant.source_order
     limit 1;
    groups_payload := '[]'::jsonb;
  else
    select coalesce(jsonb_agg(
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
            join public.bracket_participants participant on participant.id = entry.participant_id
           where entry.group_id = bracket_group.id
        ), '[]'::jsonb),
        'matches', coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'round', bracket_match.round,
              'order', bracket_match.pair_index,
              'sideA', coalesce(
                public.bracket_entry_to_json(
                  public.bracket_resolve_match_side(bracket_match.id, 'A'),
                  false
                )->>'name',
                case when bracket_match.side_a_source_match_id is not null
                  then 'Vencedor da semifinal ' || (
                    select source_match.pair_index::text
                      from public.bracket_matches source_match
                     where source_match.id = bracket_match.side_a_source_match_id
                  )
                end
              ),
              'sideB', coalesce(
                public.bracket_entry_to_json(
                  public.bracket_resolve_match_side(bracket_match.id, 'B'),
                  false
                )->>'name',
                case when bracket_match.side_b_source_match_id is not null
                  then 'Vencedor da semifinal ' || (
                    select source_match.pair_index::text
                      from public.bracket_matches source_match
                     where source_match.id = bracket_match.side_b_source_match_id
                  )
                end
              ),
              'status', bracket_match.status,
              'winner', public.bracket_entry_to_json(bracket_match.winner_entry_id, false)->>'name',
              'isWalkover', bracket_match.status = 'wo'
            )
            order by
              case bracket_match.round when 'semifinal' then 1 else 2 end,
              bracket_match.pair_index
          )
            from public.bracket_matches bracket_match
           where bracket_match.group_id = bracket_group.id
        ), '[]'::jsonb),
        'placements', public.bracket_group_placements_to_json(bracket_group.id, false)
      )
      order by bracket_group.sort_order
    ), '[]'::jsonb)
      into groups_payload
      from public.bracket_groups bracket_group
     where bracket_group.bracket_id = bracket_row.id;
  end if;

  return jsonb_build_object(
    'category', category_name,
    'mode', bracket_row.mode,
    'status', bracket_row.status,
    'athlete', single_athlete,
    'groups', groups_payload
  );
end;
$fn$;

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
         'publicado', 'inscricao', 'pagamento', 'checagem',
         'chaves', 'em_andamento', 'concluido'
       )
  ) then
    return '[]'::jsonb;
  end if;

  select coalesce(jsonb_agg(
    public.public_category_bracket_to_json(bracket.id)
    order by category.nome
  ), '[]'::jsonb)
    into result
    from public.category_brackets bracket
    join public.event_categories category on category.id = bracket.category_id
   where bracket.event_id = target_event_id
     and bracket.status in ('publicada', 'em_andamento', 'concluida');

  return result;
end;
$fn$;

revoke execute on function public.protect_bracket_match_result() from public, anon, authenticated;
revoke execute on function public.bracket_resolve_match_side(uuid, text) from public, anon, authenticated;
revoke execute on function public.bracket_entry_to_json(uuid, boolean) from public, anon, authenticated;
revoke execute on function public.bracket_group_placements_to_json(uuid, boolean) from public, anon, authenticated;
revoke execute on function public.category_bracket_operation_to_json(uuid) from public, anon, authenticated;
revoke execute on function public.public_category_bracket_to_json(uuid) from public, anon, authenticated;

revoke all on function public.get_category_bracket_operation(uuid) from public, anon;
revoke all on function public.start_category_bracket(uuid) from public, anon;
revoke all on function public.record_bracket_match_outcome(uuid, uuid, public.match_status) from public, anon;
grant execute on function public.get_category_bracket_operation(uuid) to authenticated;
grant execute on function public.start_category_bracket(uuid) to authenticated;
grant execute on function public.record_bracket_match_outcome(uuid, uuid, public.match_status) to authenticated;

revoke all on function public.get_public_event_brackets(uuid) from public;
grant execute on function public.get_public_event_brackets(uuid) to anon, authenticated;

commit;
