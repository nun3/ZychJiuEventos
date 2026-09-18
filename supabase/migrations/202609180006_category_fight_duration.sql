-- Sprint 11: duracao oficial da luta por categoria.
-- Source of truth em event_categories; projecao ao vivo nas chaves/programacao.
-- Nao copia para match, nao cria snapshot de chave e nao reabre Sprints 8/9/10.
begin;

alter table public.event_categories
  add column fight_duration_minutes numeric(4,2);

alter table public.event_categories
  add constraint event_categories_fight_duration_minutes_chk
  check (
    fight_duration_minutes is null
    or (
      fight_duration_minutes >= 0.5
      and fight_duration_minutes <= 20
      and fight_duration_minutes = round(fight_duration_minutes * 2) / 2
    )
  );

comment on column public.event_categories.fight_duration_minutes is
  'Duracao oficial da luta em minutos. Nula quando nao configurada. Nao e eixo de categorizacao e nao e copiada para o confronto.';

create or replace function public.set_event_category_duration(
  target_category_id uuid,
  duration_minutes numeric
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  actor uuid := auth.uid();
  category_row public.event_categories%rowtype;
  target_event public.events%rowtype;
  previous numeric(4,2);
begin
  if actor is null then raise exception 'Sessao obrigatoria'; end if;
  if target_category_id is null then raise exception 'Categoria obrigatoria'; end if;
  if duration_minutes is not null and (
    duration_minutes < 0.5
    or duration_minutes > 20
    or duration_minutes <> round(duration_minutes * 2) / 2
  ) then
    raise exception 'Duracao da luta invalida';
  end if;

  select * into category_row
    from public.event_categories
   where id = target_category_id;
  if not found then raise exception 'Categoria inexistente'; end if;

  select event_row.* into target_event
    from public.category_rule_sets rules
    join public.events event_row on event_row.id = rules.event_id
   where rules.id = category_row.rule_set_id;
  if not found then raise exception 'Categoria inexistente'; end if;

  if not public.is_platform_admin() and not exists (
    select 1
      from public.organization_members member
     where member.organization_id = target_event.organization_id
       and member.user_id = actor
       and member.role in ('owner', 'organizer')
  ) then
    raise exception 'Sem permissao para configurar categorias';
  end if;

  previous := category_row.fight_duration_minutes;

  update public.event_categories
     set fight_duration_minutes = duration_minutes
   where id = category_row.id;

  insert into public.event_audit_logs (
    organization_id, event_id, actor_id, action, resource_type,
    resource_id, before_data, after_data
  ) values (
    target_event.organization_id, target_event.id, actor,
    'category_duration_updated', 'event_category', category_row.id,
    jsonb_build_object('durationMinutes', previous),
    jsonb_build_object('durationMinutes', duration_minutes)
  );

  return jsonb_build_object(
    'kind', 'category_duration',
    'categoryId', category_row.id,
    'eventId', target_event.id,
    'durationMinutes', duration_minutes
  );
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
  duration_minutes numeric(4,2);
  groups_payload jsonb;
begin
  select * into bracket_row
    from public.category_brackets
   where id = target_bracket_id;
  if not found then raise exception 'Chave inexistente'; end if;
  select nome, fight_duration_minutes into category_name, duration_minutes
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
    'durationMinutes', duration_minutes,
    'version', bracket_row.version,
    'mode', bracket_row.mode,
    'status', bracket_row.status,
    'groups', groups_payload
  );
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
  duration_minutes numeric(4,2);
  single_athlete jsonb;
  groups_payload jsonb;
begin
  select * into bracket_row
    from public.category_brackets
   where id = target_bracket_id
     and status in ('publicada', 'em_andamento', 'concluida');
  if not found then return null; end if;
  select nome, fight_duration_minutes into category_name, duration_minutes
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
    'durationMinutes', duration_minutes,
    'mode', bracket_row.mode,
    'status', bracket_row.status,
    'athlete', single_athlete,
    'groups', groups_payload
  );
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
      'durationMinutes', category.fight_duration_minutes,
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
          'durationMinutes', category.fight_duration_minutes,
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
    'durationMinutes', category.fight_duration_minutes,
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

revoke all on function public.set_event_category_duration(uuid, numeric) from public;
revoke execute on function public.set_event_category_duration(uuid, numeric) from anon;
grant execute on function public.set_event_category_duration(uuid, numeric) to authenticated;

revoke execute on function public.category_bracket_operation_to_json(uuid) from public, anon, authenticated;
revoke execute on function public.public_category_bracket_to_json(uuid) from public, anon, authenticated;

revoke all on function public.get_public_event_schedule(uuid) from public;
grant execute on function public.get_public_event_schedule(uuid) to anon, authenticated;

commit;
