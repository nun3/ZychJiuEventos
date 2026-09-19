-- Sprint 13 lote 3: professor operacional por inscricao.
-- Distinto do Professor cadastral. Sem organization_role e sem fallback de athlete_managers.
begin;

alter table public.registrations
  add column if not exists operational_professor_name text,
  add column if not exists operational_professor_user_id uuid references public.profiles(id) on delete set null;

alter table public.registrations
  drop constraint if exists registrations_operational_professor_name_len,
  drop constraint if exists registrations_operational_professor_user_requires_name;

alter table public.registrations
  add constraint registrations_operational_professor_name_len
    check (operational_professor_name is null or char_length(trim(operational_professor_name)) >= 2),
  add constraint registrations_operational_professor_user_requires_name
    check (operational_professor_user_id is null or operational_professor_name is not null);

comment on column public.registrations.operational_professor_name is
  'Snapshot historico do treinador informado para o atleta neste evento. Independente da conta.';
comment on column public.registrations.operational_professor_user_id is
  'Referencia opcional ao usuario Professor cadastral. Ausencia nao impede o snapshot.';

create index if not exists registrations_event_operational_professor_name_idx
  on public.registrations (event_id, operational_professor_name)
  where operational_professor_name is not null;

create or replace function public.protect_registration_snapshot()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.event_id is distinct from old.event_id
    or new.athlete_id is distinct from old.athlete_id
    or new.category_id is distinct from old.category_id
    or new.registered_by is distinct from old.registered_by
    or new.valor is distinct from old.valor
    or new.athlete_snapshot is distinct from old.athlete_snapshot
    or new.category_snapshot is distinct from old.category_snapshot
    or new.rule_set_version is distinct from old.rule_set_version
    or new.terms_version is distinct from old.terms_version
    or new.terms_accepted_at is distinct from old.terms_accepted_at
    or new.operational_professor_name is distinct from old.operational_professor_name
    or new.operational_professor_user_id is distinct from old.operational_professor_user_id
  then raise exception 'Snapshot da inscricao e imutavel' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop function if exists public.create_event_registrations(uuid, uuid[], text, boolean);

create function public.create_event_registrations(
  target_event_id uuid,
  target_athlete_ids uuid[],
  accepted_terms_version text,
  terms_accepted boolean,
  operational_professor_names text[] default null,
  operational_professor_link_self boolean[] default null
)
returns table (registration_id uuid, athlete_id uuid, category_id uuid, numero bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_event public.events%rowtype;
  selected_athlete_id uuid;
  active_rule public.category_rule_sets%rowtype;
  athlete_record record;
  chosen_category public.event_categories%rowtype;
  athlete_age integer;
  athlete_belt_order integer;
  tied_categories integer;
  new_registration_id uuid;
  new_registration_number bigint;
  athlete_count integer := coalesce(array_length(target_athlete_ids, 1), 0);
  athlete_index integer := 0;
  professor_name text;
  professor_user uuid;
  actor_is_professor boolean := false;
begin
  if auth.uid() is null then raise exception 'Autenticacao obrigatoria'; end if;
  if terms_accepted is distinct from true or accepted_terms_version is distinct from 'MVP-2026-09' then
    raise exception 'Aceite dos termos obrigatorio';
  end if;
  if athlete_count = 0 then
    raise exception 'Selecione ao menos um atleta';
  end if;
  if athlete_count <> (select count(distinct selected.id) from unnest(target_athlete_ids) as selected(id)) then
    raise exception 'Lista de atletas duplicada';
  end if;
  if operational_professor_names is not null
    and coalesce(array_length(operational_professor_names, 1), 0) is distinct from athlete_count then
    raise exception 'Informe o professor operacional de cada atleta';
  end if;
  if operational_professor_link_self is not null
    and coalesce(array_length(operational_professor_link_self, 1), 0) is distinct from athlete_count then
    raise exception 'Vinculo do professor operacional inconsistente';
  end if;

  select
    coalesce(user_row.raw_user_meta_data->>'tipo_cadastro', '') = 'professor'
    or exists (select 1 from public.teams team_row where team_row.created_by = auth.uid())
    or exists (
      select 1
        from public.athlete_managers manager_row
       where manager_row.manager_id = auth.uid()
         and manager_row.relationship_type = 'professor'
    )
    into actor_is_professor
    from auth.users user_row
   where user_row.id = auth.uid();

  select * into target_event from public.events where id = target_event_id for share;
  if not found then raise exception 'Evento inexistente'; end if;
  if target_event.status <> 'inscricao' then raise exception 'Evento fora da fase de inscricao'; end if;
  if not exists (
    select 1 from public.event_phases
    where event_id = target_event_id and tipo = 'inscricao'
      and now() between inicio and fim
  ) then raise exception 'Prazo de inscricao encerrado'; end if;

  select * into active_rule from public.category_rule_sets
  where event_id = target_event_id and ativo = true
  order by versao desc limit 1;
  if not found then raise exception 'Evento sem conjunto de categorias ativo'; end if;

  foreach selected_athlete_id in array target_athlete_ids loop
    athlete_index := athlete_index + 1;
    if not public.manages_athlete(selected_athlete_id) then raise exception 'Atleta fora do seu escopo'; end if;
    if exists (
      select 1 from public.registrations r where r.event_id = target_event_id
        and r.athlete_id = selected_athlete_id
        and r.status in ('rascunho', 'pendente_pagamento', 'efetivada')
    ) then raise exception 'Atleta ja possui inscricao ativa no evento'; end if;

    select a.*, t.nome as team_name into athlete_record
    from public.athletes a join public.teams t on t.id = a.team_id
    where a.id = selected_athlete_id for share of a;
    if not found then raise exception 'Atleta inexistente'; end if;

    professor_name := null;
    professor_user := null;
    if operational_professor_names is not null then
      professor_name := nullif(trim(operational_professor_names[athlete_index]), '');
      if professor_name is null or char_length(professor_name) < 2 then
        raise exception 'Informe o professor operacional de %', athlete_record.nome_completo;
      end if;
    end if;
    if coalesce(operational_professor_link_self[athlete_index], false) then
      if not actor_is_professor then
        raise exception 'Somente conta Professor pode ser vinculada';
      end if;
      if professor_name is null then
        raise exception 'Informe o professor operacional de %', athlete_record.nome_completo;
      end if;
      professor_user := auth.uid();
    end if;

    athlete_age := extract(year from age(target_event.data_evento, athlete_record.data_nascimento));
    athlete_belt_order := public.belt_order(athlete_record.faixa);
    if athlete_belt_order is null then raise exception 'Faixa do atleta nao reconhecida'; end if;

    select c.* into chosen_category
    from public.event_categories c
    where c.rule_set_id = active_rule.id and c.ativa = true
      and athlete_age between c.idade_min and c.idade_max
      and upper(c.genero) = upper(athlete_record.genero)
      and athlete_belt_order between c.faixa_min_ordem and c.faixa_max_ordem
      and athlete_record.peso_kg between c.peso_min_kg and c.peso_max_kg
    order by c.ordem, c.id limit 1;
    if not found then raise exception 'Nenhuma categoria elegivel para %', athlete_record.nome_completo; end if;

    select count(*) into tied_categories from public.event_categories c
    where c.rule_set_id = active_rule.id and c.ativa = true and c.ordem = chosen_category.ordem
      and athlete_age between c.idade_min and c.idade_max
      and upper(c.genero) = upper(athlete_record.genero)
      and athlete_belt_order between c.faixa_min_ordem and c.faixa_max_ordem
      and athlete_record.peso_kg between c.peso_min_kg and c.peso_max_kg;
    if tied_categories > 1 then raise exception 'Categorizacao ambigua para %', athlete_record.nome_completo; end if;

    insert into public.registrations (
      event_id, athlete_id, category_id, registered_by, status, valor,
      athlete_snapshot, category_snapshot, rule_set_version,
      terms_version, terms_accepted_at,
      operational_professor_name, operational_professor_user_id
    ) values (
      target_event_id, athlete_record.id, chosen_category.id, auth.uid(),
      'pendente_pagamento', target_event.valor_inscricao,
      jsonb_build_object(
        'nome_completo', athlete_record.nome_completo,
        'data_nascimento', athlete_record.data_nascimento,
        'genero', athlete_record.genero,
        'faixa', athlete_record.faixa,
        'peso_kg', athlete_record.peso_kg,
        'team_id', athlete_record.team_id,
        'team_name', athlete_record.team_name
      ),
      to_jsonb(chosen_category) || jsonb_build_object(
        'rule_set_id', active_rule.id,
        'rule_set_name', active_rule.nome,
        'rule_set_version', active_rule.versao,
        'valor', target_event.valor_inscricao
      ),
      active_rule.versao, accepted_terms_version, now(),
      professor_name, professor_user
    ) returning id, registrations.numero into new_registration_id, new_registration_number;

    registration_id := new_registration_id;
    athlete_id := selected_athlete_id;
    category_id := chosen_category.id;
    numero := new_registration_number;
    return next;
  end loop;
end;
$$;

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
  professor_name text;
begin
  resolved_entry := public.bracket_resolve_match_side(target_match_id, target_side);
  if resolved_entry is not null then
    athlete := public.bracket_entry_to_json(resolved_entry, false);
    if athlete is not null then
      select nullif(trim(registration.operational_professor_name), '')
        into professor_name
        from public.bracket_entries entry
        join public.bracket_participants participant on participant.id = entry.participant_id
        left join public.registrations registration on registration.id = participant.registration_id
       where entry.id = resolved_entry;
      return athlete || jsonb_build_object('resolved', true, 'professor', professor_name);
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
        'professor', null,
        'resolved', false
      );
    end if;
  end if;

  return jsonb_build_object('name', 'A definir', 'team', null, 'professor', null, 'resolved', false);
end;
$fn$;

create or replace function public.get_public_event_checking(target_event_id uuid)
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
       and event_row.status in ('checagem', 'chaves', 'em_andamento', 'concluido')
  ) then
    return jsonb_build_object('kind', 'public_checking', 'athletes', '[]'::jsonb);
  end if;

  select jsonb_build_object(
    'kind', 'public_checking',
    'athletes', coalesce(jsonb_agg(
      jsonb_build_object(
        'name', projected.athlete_name,
        'team', projected.team_name,
        'professor', projected.professor_name,
        'category', projected.category_name,
        'alone', projected.alone
      )
      order by projected.category_name, projected.athlete_name
    ), '[]'::jsonb)
  )
    into result
    from (
      select
        nullif(trim(registration.athlete_snapshot->>'nome_completo'), '') as athlete_name,
        nullif(trim(registration.athlete_snapshot->>'team_name'), '') as team_name,
        nullif(trim(registration.operational_professor_name), '') as professor_name,
        category.nome as category_name,
        count(*) over (
          partition by coalesce(registration.current_category_id, registration.category_id)
        ) = 1 as alone
      from public.registrations registration
      join public.event_categories category
        on category.id = coalesce(registration.current_category_id, registration.category_id)
      where registration.event_id = target_event_id
        and registration.status = 'efetivada'
    ) projected
   where projected.athlete_name is not null;

  return coalesce(result, jsonb_build_object('kind', 'public_checking', 'athletes', '[]'::jsonb));
end;
$fn$;

comment on function public.create_event_registrations(uuid, uuid[], text, boolean, text[], boolean[]) is
  'Cria inscricoes. O professor operacional e informado por inscricao; nao copia athlete_managers.';
comment on function public.get_public_event_checking(uuid) is
  'Lista publica da checagem: nome completo, equipe, professor operacional e categoria vigente. Sem IDs, dados de conta, peso ou financeiro.';
comment on function public.public_schedule_side_to_json(uuid, text) is
  'Lado publico da luta: nome, equipe e professor operacional da inscricao. Sem IDs internos.';

revoke execute on function public.protect_registration_snapshot() from public;
revoke all on function public.create_event_registrations(uuid, uuid[], text, boolean, text[], boolean[]) from public;
revoke execute on function public.public_schedule_side_to_json(uuid, text) from public, anon, authenticated;
revoke all on function public.get_public_event_checking(uuid) from public;
grant execute on function public.create_event_registrations(uuid, uuid[], text, boolean, text[], boolean[]) to authenticated;
grant execute on function public.get_public_event_checking(uuid) to anon, authenticated;

commit;
