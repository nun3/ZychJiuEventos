-- Sprint 7: elegibilidade operacional da checagem por adjacencia estrutural.
-- category_is_eligible_for_registration permanece intacta.
-- Politica padrao da plataforma; flags por rule set ficam como divida consciente.
begin;

create or replace function public.category_is_eligible_for_checking_reallocation(
  current_category public.event_categories,
  target_category public.event_categories
)
returns boolean
language plpgsql
stable
set search_path = ''
as $$
declare
  weight_changed boolean;
  age_changed boolean;
  axis_ambiguous boolean := false;
  immediate_successor uuid;
  immediate_predecessor uuid;
begin
  if current_category.id is null or target_category.id is null then return false; end if;
  if current_category.id = target_category.id then return false; end if;
  if not coalesce(target_category.ativa, false) then return false; end if;
  if current_category.rule_set_id is distinct from target_category.rule_set_id then return false; end if;
  if upper(current_category.genero) is distinct from upper(target_category.genero) then return false; end if;
  if current_category.faixa_min_ordem is distinct from target_category.faixa_min_ordem
    or current_category.faixa_max_ordem is distinct from target_category.faixa_max_ordem
  then return false; end if;

  weight_changed := current_category.peso_min_kg is distinct from target_category.peso_min_kg
    or current_category.peso_max_kg is distinct from target_category.peso_max_kg;
  age_changed := current_category.idade_min is distinct from target_category.idade_min
    or current_category.idade_max is distinct from target_category.idade_max;
  if weight_changed = age_changed then return false; end if;

  if weight_changed then
    if current_category.idade_min is distinct from target_category.idade_min
      or current_category.idade_max is distinct from target_category.idade_max
    then return false; end if;

    select exists (
      select 1
      from public.event_categories a
      join public.event_categories b on a.id < b.id
      where a.rule_set_id = current_category.rule_set_id
        and b.rule_set_id = current_category.rule_set_id
        and (a.id = current_category.id or (
          a.ativa
          and upper(a.genero) = upper(current_category.genero)
          and a.idade_min = current_category.idade_min
          and a.idade_max = current_category.idade_max
          and a.faixa_min_ordem = current_category.faixa_min_ordem
          and a.faixa_max_ordem = current_category.faixa_max_ordem
        ))
        and (b.id = current_category.id or (
          b.ativa
          and upper(b.genero) = upper(current_category.genero)
          and b.idade_min = current_category.idade_min
          and b.idade_max = current_category.idade_max
          and b.faixa_min_ordem = current_category.faixa_min_ordem
          and b.faixa_max_ordem = current_category.faixa_max_ordem
        ))
        and a.peso_min_kg <= b.peso_max_kg
        and b.peso_min_kg <= a.peso_max_kg
    ) into axis_ambiguous;
    if axis_ambiguous then return false; end if;

    select successor.id into immediate_successor
    from (
      select category.id,
        row_number() over (
          order by category.peso_min_kg, category.peso_max_kg, category.id
        ) as position
      from public.event_categories category
      where category.rule_set_id = current_category.rule_set_id
        and (category.id = current_category.id or (
          category.ativa
          and upper(category.genero) = upper(current_category.genero)
          and category.idade_min = current_category.idade_min
          and category.idade_max = current_category.idade_max
          and category.faixa_min_ordem = current_category.faixa_min_ordem
          and category.faixa_max_ordem = current_category.faixa_max_ordem
        ))
    ) origin
    join (
      select category.id,
        row_number() over (
          order by category.peso_min_kg, category.peso_max_kg, category.id
        ) as position
      from public.event_categories category
      where category.rule_set_id = current_category.rule_set_id
        and (category.id = current_category.id or (
          category.ativa
          and upper(category.genero) = upper(current_category.genero)
          and category.idade_min = current_category.idade_min
          and category.idade_max = current_category.idade_max
          and category.faixa_min_ordem = current_category.faixa_min_ordem
          and category.faixa_max_ordem = current_category.faixa_max_ordem
        ))
    ) successor on successor.position = origin.position + 1
    where origin.id = current_category.id;

    return immediate_successor is not distinct from target_category.id
      and target_category.peso_min_kg > current_category.peso_max_kg;
  end if;

  if current_category.peso_min_kg is distinct from target_category.peso_min_kg
    or current_category.peso_max_kg is distinct from target_category.peso_max_kg
  then return false; end if;

  select exists (
    select 1
    from public.event_categories a
    join public.event_categories b on a.id < b.id
    where a.rule_set_id = current_category.rule_set_id
      and b.rule_set_id = current_category.rule_set_id
      and (a.id = current_category.id or (
        a.ativa
        and upper(a.genero) = upper(current_category.genero)
        and a.peso_min_kg = current_category.peso_min_kg
        and a.peso_max_kg = current_category.peso_max_kg
        and a.faixa_min_ordem = current_category.faixa_min_ordem
        and a.faixa_max_ordem = current_category.faixa_max_ordem
      ))
      and (b.id = current_category.id or (
        b.ativa
        and upper(b.genero) = upper(current_category.genero)
        and b.peso_min_kg = current_category.peso_min_kg
        and b.peso_max_kg = current_category.peso_max_kg
        and b.faixa_min_ordem = current_category.faixa_min_ordem
        and b.faixa_max_ordem = current_category.faixa_max_ordem
      ))
      and a.idade_min <= b.idade_max
      and b.idade_min <= a.idade_max
  ) into axis_ambiguous;
  if axis_ambiguous then return false; end if;

  select successor.id into immediate_successor
  from (
    select category.id,
      row_number() over (
        order by category.idade_min, category.idade_max, category.id
      ) as position
    from public.event_categories category
    where category.rule_set_id = current_category.rule_set_id
      and (category.id = current_category.id or (
        category.ativa
        and upper(category.genero) = upper(current_category.genero)
        and category.peso_min_kg = current_category.peso_min_kg
        and category.peso_max_kg = current_category.peso_max_kg
        and category.faixa_min_ordem = current_category.faixa_min_ordem
        and category.faixa_max_ordem = current_category.faixa_max_ordem
      ))
  ) origin
  join (
    select category.id,
      row_number() over (
        order by category.idade_min, category.idade_max, category.id
      ) as position
    from public.event_categories category
    where category.rule_set_id = current_category.rule_set_id
      and (category.id = current_category.id or (
        category.ativa
        and upper(category.genero) = upper(current_category.genero)
        and category.peso_min_kg = current_category.peso_min_kg
        and category.peso_max_kg = current_category.peso_max_kg
        and category.faixa_min_ordem = current_category.faixa_min_ordem
        and category.faixa_max_ordem = current_category.faixa_max_ordem
      ))
  ) successor on successor.position = origin.position + 1
  where origin.id = current_category.id;

  select predecessor.id into immediate_predecessor
  from (
    select category.id,
      row_number() over (
        order by category.idade_min, category.idade_max, category.id
      ) as position
    from public.event_categories category
    where category.rule_set_id = current_category.rule_set_id
      and (category.id = current_category.id or (
        category.ativa
        and upper(category.genero) = upper(current_category.genero)
        and category.peso_min_kg = current_category.peso_min_kg
        and category.peso_max_kg = current_category.peso_max_kg
        and category.faixa_min_ordem = current_category.faixa_min_ordem
        and category.faixa_max_ordem = current_category.faixa_max_ordem
      ))
  ) origin
  join (
    select category.id,
      row_number() over (
        order by category.idade_min, category.idade_max, category.id
      ) as position
    from public.event_categories category
    where category.rule_set_id = current_category.rule_set_id
      and (category.id = current_category.id or (
        category.ativa
        and upper(category.genero) = upper(current_category.genero)
        and category.peso_min_kg = current_category.peso_min_kg
        and category.peso_max_kg = current_category.peso_max_kg
        and category.faixa_min_ordem = current_category.faixa_min_ordem
        and category.faixa_max_ordem = current_category.faixa_max_ordem
      ))
  ) predecessor on predecessor.position = origin.position - 1
  where origin.id = current_category.id;

  if immediate_successor is not distinct from target_category.id then
    return target_category.idade_min > current_category.idade_max;
  end if;
  if immediate_predecessor is not distinct from target_category.id then
    return target_category.idade_max < current_category.idade_min;
  end if;
  return false;
end;
$$;

create or replace function public.list_eligible_category_changes(target_registration_id uuid)
returns table (id uuid, nome text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_registration public.registrations%rowtype;
  original_rule_set uuid;
  current_category uuid;
  current_category_row public.event_categories%rowtype;
begin
  if auth.uid() is null then raise exception 'Sessao obrigatoria'; end if;
  select * into target_registration from public.registrations where registrations.id = target_registration_id;
  if not found then raise exception 'Inscricao inexistente'; end if;
  if not public.manages_athlete(target_registration.athlete_id) then
    raise exception 'Sem permissao para solicitar alteracao';
  end if;
  begin
    perform public.assert_registration_can_request_category_change(target_registration);
  exception
    when others then
      return;
  end;
  select category.rule_set_id into original_rule_set
  from public.event_categories category
  where category.id = target_registration.category_id;
  current_category := public.registration_current_category_id(target_registration);
  select * into current_category_row from public.event_categories where event_categories.id = current_category;
  if original_rule_set is null or current_category_row.id is null then return; end if;
  if current_category_row.rule_set_id is distinct from original_rule_set then return; end if;
  return query
    select category.id, category.nome
    from public.event_categories category
    where category.rule_set_id = original_rule_set
      and category.id <> current_category
      and public.category_is_eligible_for_checking_reallocation(current_category_row, category)
    order by category.ordem, category.nome, category.id;
end;
$$;

create or replace function public.request_category_change(
  target_registration_id uuid,
  requested_category_id uuid,
  reason_text text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  target_registration public.registrations%rowtype;
  target_event public.events%rowtype;
  requested_category public.event_categories%rowtype;
  current_category_row public.event_categories%rowtype;
  original_rule_set uuid;
  current_category uuid;
  new_request_id uuid;
  normalized_reason text := trim(coalesce(reason_text, ''));
begin
  if actor is null then raise exception 'Sessao obrigatoria'; end if;
  if length(normalized_reason) < 5 then raise exception 'Informe um motivo com ao menos 5 caracteres'; end if;

  select * into target_registration
  from public.registrations
  where id = target_registration_id
  for update;
  if not found then raise exception 'Inscricao inexistente'; end if;
  if not public.manages_athlete(target_registration.athlete_id) then
    raise exception 'Sem permissao para solicitar alteracao';
  end if;

  perform public.assert_registration_can_request_category_change(target_registration);
  current_category := public.registration_current_category_id(target_registration);
  if exists (
    select 1 from public.category_change_requests request
    where request.registration_id = target_registration.id and request.status = 'pendente'
  ) then raise exception 'Ja existe solicitacao pendente'; end if;

  select * into requested_category from public.event_categories where id = requested_category_id for share;
  if not found then raise exception 'Categoria inexistente'; end if;
  select category.rule_set_id into original_rule_set
  from public.event_categories category
  where category.id = target_registration.category_id;
  select * into current_category_row from public.event_categories where id = current_category for share;
  select * into target_event from public.events where id = target_registration.event_id;
  if original_rule_set is null
    or current_category_row.id is null
    or requested_category.rule_set_id is distinct from original_rule_set
    or current_category_row.rule_set_id is distinct from original_rule_set
    or requested_category.id = current_category
    or not public.category_is_eligible_for_checking_reallocation(current_category_row, requested_category)
  then raise exception 'Categoria de destino invalida'; end if;

  insert into public.category_change_requests (
    registration_id, requested_by, current_category_id, requested_category_id, reason
  ) values (
    target_registration.id, actor, current_category, requested_category.id, normalized_reason
  ) returning id into new_request_id;

  insert into public.event_audit_logs (
    organization_id, event_id, actor_id, action, resource_type,
    resource_id, before_data, after_data, reason
  ) values (
    target_event.organization_id, target_event.id, actor,
    'category_change_requested', 'category_change_request', new_request_id,
    jsonb_build_object('registrationId', target_registration.id, 'categoryId', current_category),
    jsonb_build_object('registrationId', target_registration.id, 'requestedCategoryId', requested_category.id, 'status', 'pendente'),
    normalized_reason
  );

  return jsonb_build_object('kind', 'requested', 'requestId', new_request_id);
end;
$$;

create or replace function public.review_category_change(
  target_request_id uuid,
  approve_request boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  change_request public.category_change_requests%rowtype;
  target_registration public.registrations%rowtype;
  target_event public.events%rowtype;
  requested_category public.event_categories%rowtype;
  current_category_row public.event_categories%rowtype;
  original_rule_set uuid;
  current_category uuid;
  next_status public.change_request_status;
  next_override uuid;
begin
  if actor is null then raise exception 'Sessao obrigatoria'; end if;
  if approve_request is null then raise exception 'Decisao obrigatoria'; end if;

  select * into change_request
  from public.category_change_requests
  where id = target_request_id
  for update;
  if not found then raise exception 'Solicitacao inexistente'; end if;
  if change_request.status <> 'pendente' then raise exception 'Solicitacao nao esta pendente'; end if;

  select * into target_registration
  from public.registrations
  where id = change_request.registration_id
  for update;
  select * into target_event
  from public.events
  where id = target_registration.event_id
  for share;

  if not public.is_platform_admin() and not exists (
    select 1 from public.organization_members member
    where member.organization_id = target_event.organization_id
      and member.user_id = actor
      and member.role in ('owner', 'organizer')
  ) then raise exception 'Sem permissao para decidir alteracao'; end if;

  if target_event.checagem_travada_em is not null then raise exception 'Checagem travada'; end if;
  if target_event.status <> 'checagem' then raise exception 'Evento fora da fase de checagem'; end if;

  current_category := public.registration_current_category_id(target_registration);
  if current_category is distinct from change_request.current_category_id then
    raise exception 'Alocacao vigente divergiu da solicitacao';
  end if;

  if approve_request then
    select * into requested_category from public.event_categories where id = change_request.requested_category_id for share;
    if not found then raise exception 'Categoria de destino invalida'; end if;
    select category.rule_set_id into original_rule_set
    from public.event_categories category
    where category.id = target_registration.category_id;
    select * into current_category_row from public.event_categories where id = current_category for share;
    if original_rule_set is null
      or current_category_row.id is null
      or requested_category.rule_set_id is distinct from original_rule_set
      or current_category_row.rule_set_id is distinct from original_rule_set
      or not public.category_is_eligible_for_checking_reallocation(current_category_row, requested_category)
    then raise exception 'Categoria de destino invalida'; end if;
    next_status := 'aprovada';
    next_override := case
      when requested_category.id = target_registration.category_id then null
      else requested_category.id
    end;
    update public.registrations
    set current_category_id = next_override, updated_at = now()
    where id = target_registration.id;
  else
    next_status := 'recusada';
  end if;

  update public.category_change_requests
  set status = next_status, reviewed_by = actor, reviewed_at = now()
  where id = change_request.id;

  insert into public.event_audit_logs (
    organization_id, event_id, actor_id, action, resource_type,
    resource_id, before_data, after_data, reason
  ) values (
    target_event.organization_id, target_event.id, actor,
    case when approve_request then 'category_change_approved' else 'category_change_rejected' end,
    'category_change_request', change_request.id,
    jsonb_build_object(
      'registrationId', target_registration.id,
      'requesterId', change_request.requested_by,
      'fromCategoryId', current_category,
      'status', change_request.status
    ),
    jsonb_build_object(
      'registrationId', target_registration.id,
      'requesterId', change_request.requested_by,
      'toCategoryId', case when approve_request then change_request.requested_category_id else current_category end,
      'status', next_status,
      'reviewedBy', actor
    ),
    change_request.reason
  );

  return jsonb_build_object('kind', 'reviewed', 'requestId', change_request.id, 'status', next_status);
end;
$$;

revoke execute on function public.category_is_eligible_for_checking_reallocation(public.event_categories, public.event_categories) from public, anon, authenticated;
revoke all on function public.list_eligible_category_changes(uuid) from public, anon;
revoke all on function public.request_category_change(uuid, uuid, text) from public, anon;
revoke all on function public.review_category_change(uuid, boolean) from public, anon;
grant execute on function public.list_eligible_category_changes(uuid) to authenticated;
grant execute on function public.request_category_change(uuid, uuid, text) to authenticated;
grant execute on function public.review_category_change(uuid, boolean) to authenticated;

commit;
