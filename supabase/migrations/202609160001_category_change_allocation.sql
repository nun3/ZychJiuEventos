-- Sprint 7 lote 2: alocacao vigente por override e decisoes atomicas de categoria.
-- O snapshot e registrations.category_id permanecem imutaveis.
begin;

alter table public.registrations
  add column if not exists current_category_id uuid references public.event_categories(id) on delete restrict;

alter table public.registrations
  drop constraint if exists registrations_current_category_override_check;
alter table public.registrations
  add constraint registrations_current_category_override_check
  check (current_category_id is null or current_category_id <> category_id);

create unique index if not exists category_change_requests_one_pending
  on public.category_change_requests (registration_id)
  where status = 'pendente';

create or replace function public.registration_current_category_id(target public.registrations)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select coalesce(target.current_category_id, target.category_id);
$$;

create or replace function public.category_is_eligible_for_registration(
  target_registration public.registrations,
  target_category public.event_categories,
  event_date date
)
returns boolean
language plpgsql
stable
set search_path = ''
as $$
declare
  athlete_age integer;
  athlete_belt_order integer;
  athlete_gender text;
  athlete_weight numeric;
begin
  if not target_category.ativa then return false; end if;
  athlete_age := extract(year from age(event_date, (target_registration.athlete_snapshot->>'data_nascimento')::date));
  athlete_belt_order := public.belt_order(target_registration.athlete_snapshot->>'faixa');
  athlete_gender := target_registration.athlete_snapshot->>'genero';
  athlete_weight := (target_registration.athlete_snapshot->>'peso_kg')::numeric;
  if athlete_belt_order is null or athlete_gender is null or athlete_weight is null then return false; end if;
  return athlete_age between target_category.idade_min and target_category.idade_max
    and upper(target_category.genero) = upper(athlete_gender)
    and athlete_belt_order between target_category.faixa_min_ordem and target_category.faixa_max_ordem
    and athlete_weight between target_category.peso_min_kg and target_category.peso_max_kg;
exception
  when others then
    return false;
end;
$$;

create or replace function public.assert_registration_can_request_category_change(target_registration public.registrations)
returns void
language plpgsql
set search_path = ''
as $$
declare
  target_event public.events%rowtype;
  current_category uuid;
  same_category_count integer;
begin
  if target_registration.status <> 'efetivada' then
    raise exception 'Inscricao nao efetivada';
  end if;
  select * into target_event from public.events where id = target_registration.event_id for share;
  if not found then raise exception 'Evento inexistente'; end if;
  if target_event.status <> 'checagem' then raise exception 'Evento fora da fase de checagem'; end if;
  if target_event.checagem_travada_em is not null then raise exception 'Checagem travada'; end if;
  current_category := public.registration_current_category_id(target_registration);
  select count(*) into same_category_count
  from public.registrations other
  where other.event_id = target_registration.event_id
    and other.status = 'efetivada'
    and public.registration_current_category_id(other) = current_category;
  if same_category_count <> 1 then raise exception 'Atleta nao esta sozinho na categoria'; end if;
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
  target_event public.events%rowtype;
  original_rule_set uuid;
  current_category uuid;
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
  select * into target_event from public.events where events.id = target_registration.event_id;
  select category.rule_set_id into original_rule_set
  from public.event_categories category
  where category.id = target_registration.category_id;
  current_category := public.registration_current_category_id(target_registration);
  return query
    select category.id, category.nome
    from public.event_categories category
    where category.rule_set_id = original_rule_set
      and category.id <> current_category
      and public.category_is_eligible_for_registration(target_registration, category, target_event.data_evento)
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
  select * into target_event from public.events where id = target_registration.event_id;
  if requested_category.rule_set_id is distinct from original_rule_set
    or requested_category.id = current_category
    or not public.category_is_eligible_for_registration(target_registration, requested_category, target_event.data_evento)
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
    if requested_category.rule_set_id is distinct from original_rule_set
      or not public.category_is_eligible_for_registration(target_registration, requested_category, target_event.data_evento)
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

drop policy if exists category_change_requests_owner_insert on public.category_change_requests;
revoke insert, update, delete on public.category_change_requests from authenticated, anon;

revoke execute on function public.registration_current_category_id(public.registrations) from public, anon, authenticated;
revoke execute on function public.category_is_eligible_for_registration(public.registrations, public.event_categories, date) from public, anon, authenticated;
revoke execute on function public.assert_registration_can_request_category_change(public.registrations) from public, anon, authenticated;
revoke all on function public.list_eligible_category_changes(uuid) from public, anon;
revoke all on function public.request_category_change(uuid, uuid, text) from public, anon;
revoke all on function public.review_category_change(uuid, boolean) from public, anon;
grant execute on function public.list_eligible_category_changes(uuid) to authenticated;
grant execute on function public.request_category_change(uuid, uuid, text) to authenticated;
grant execute on function public.review_category_change(uuid, boolean) to authenticated;

commit;
