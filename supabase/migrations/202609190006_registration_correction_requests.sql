-- Correcao auditada da inscricao. Contrato distinto de category_change_requests.
-- Campos deste lote: nome, faixa, peso, equipe. Sem recategorizacao automatica.
begin;

create type public.registration_correction_field as enum ('nome', 'faixa', 'peso', 'equipe');

create table public.registration_correction_requests (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations(id) on delete cascade,
  requested_by uuid not null references public.profiles(id),
  requested_field public.registration_correction_field not null,
  previous_value jsonb not null,
  requested_value jsonb not null,
  reason text,
  status public.change_request_status not null default 'pendente',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  category_compatible boolean,
  created_at timestamptz not null default now(),
  check (reason is null or length(trim(reason)) > 0),
  check ((status = 'pendente' and reviewed_by is null and reviewed_at is null and category_compatible is null) or
         (status = 'aprovada' and reviewed_by is not null and reviewed_at is not null and category_compatible is not null) or
         (status = 'recusada' and reviewed_by is not null and reviewed_at is not null and category_compatible is null))
);

comment on table public.registration_correction_requests is
  'Solicitacao auditada de correcao da inscricao. Nao substitui category_change_requests.';
comment on column public.registration_correction_requests.category_compatible is
  'Preenchido na aprovacao: se a categoria vigente continua elegivel apos a correcao. Nunca dispara recategorizacao.';

create unique index registration_correction_requests_one_pending_field
  on public.registration_correction_requests (registration_id, requested_field)
  where status = 'pendente';

create index registration_correction_requests_registration_idx
  on public.registration_correction_requests (registration_id, created_at);

alter table public.registration_correction_requests enable row level security;

create policy registration_correction_requests_select on public.registration_correction_requests
for select using (
  requested_by = auth.uid()
  or public.is_platform_admin()
  or exists (
    select 1
    from public.registrations registration
    where registration.id = registration_id
      and public.manages_athlete(registration.athlete_id)
  )
  or exists (
    select 1
    from public.registrations registration
    join public.events event on event.id = registration.event_id
    where registration.id = registration_id
      and public.has_organization_role(event.organization_id, array['owner', 'organizer']::public.organization_role[])
  )
);

create or replace function public.protect_registration_snapshot()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_setting('jiu.allow_registration_correction', true) = '1' then
    if new.event_id is distinct from old.event_id
      or new.athlete_id is distinct from old.athlete_id
      or new.category_id is distinct from old.category_id
      or new.registered_by is distinct from old.registered_by
      or new.valor is distinct from old.valor
      or new.category_snapshot is distinct from old.category_snapshot
      or new.rule_set_version is distinct from old.rule_set_version
      or new.terms_version is distinct from old.terms_version
      or new.terms_accepted_at is distinct from old.terms_accepted_at
      or new.operational_professor_name is distinct from old.operational_professor_name
      or new.operational_professor_user_id is distinct from old.operational_professor_user_id
    then raise exception 'Snapshot da inscricao e imutavel' using errcode = '23514';
    end if;
    return new;
  end if;

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

create or replace function public.assert_registration_correction_window(target_registration public.registrations)
returns void
language plpgsql
set search_path = ''
as $$
declare
  target_event public.events%rowtype;
begin
  if target_registration.status <> 'efetivada' then
    raise exception 'Inscricao nao efetivada';
  end if;
  select * into target_event from public.events where id = target_registration.event_id for share;
  if not found then raise exception 'Evento inexistente'; end if;
  if target_event.status <> 'checagem' then raise exception 'Evento fora da fase de checagem'; end if;
  if target_event.checagem_travada_em is not null then raise exception 'Checagem travada'; end if;
end;
$$;

create or replace function public.request_registration_correction(
  target_registration_id uuid,
  requested_field public.registration_correction_field,
  requested_text text,
  reason_text text default null
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
  current_athlete public.athletes%rowtype;
  target_team public.teams%rowtype;
  normalized_reason text := nullif(trim(coalesce(reason_text, '')), '');
  normalized_text text := trim(coalesce(requested_text, ''));
  previous_payload jsonb;
  requested_payload jsonb;
  current_name text;
  current_belt text;
  current_weight numeric;
  current_team_id uuid;
  current_team_name text;
  requested_weight numeric;
  requested_team_id uuid;
  new_request_id uuid;
begin
  if actor is null then raise exception 'Sessao obrigatoria'; end if;
  if requested_field is null then raise exception 'Campo obrigatorio'; end if;
  if normalized_text = '' then raise exception 'Valor solicitado obrigatorio'; end if;

  select * into target_registration
  from public.registrations
  where id = target_registration_id
  for update;
  if not found then raise exception 'Inscricao inexistente'; end if;
  if not public.manages_athlete(target_registration.athlete_id) then
    raise exception 'Sem permissao para solicitar correcao';
  end if;

  perform public.assert_registration_correction_window(target_registration);
  select * into target_event from public.events where id = target_registration.event_id;
  select * into current_athlete from public.athletes where id = target_registration.athlete_id for share;
  if not found then raise exception 'Atleta inexistente'; end if;

  if exists (
    select 1 from public.registration_correction_requests request
    where request.registration_id = target_registration.id
      and request.requested_field = requested_field
      and request.status = 'pendente'
  ) then raise exception 'Ja existe solicitacao pendente deste campo'; end if;

  current_name := coalesce(target_registration.athlete_snapshot->>'nome_completo', current_athlete.nome_completo);
  current_belt := coalesce(target_registration.athlete_snapshot->>'faixa', current_athlete.faixa);
  current_weight := coalesce((target_registration.athlete_snapshot->>'peso_kg')::numeric, current_athlete.peso_kg);
  current_team_id := coalesce((target_registration.athlete_snapshot->>'team_id')::uuid, current_athlete.team_id);
  current_team_name := coalesce(target_registration.athlete_snapshot->>'team_name', (
    select team.nome from public.teams team where team.id = current_team_id
  ));

  if requested_field = 'nome' then
    if char_length(normalized_text) < 3 then raise exception 'Nome invalido'; end if;
    if lower(normalized_text) = lower(trim(current_name)) then raise exception 'Valor solicitado igual ao atual'; end if;
    previous_payload := jsonb_build_object('nome_completo', current_name);
    requested_payload := jsonb_build_object('nome_completo', normalized_text);
  elsif requested_field = 'faixa' then
    if public.belt_order(normalized_text) is null then raise exception 'Faixa do atleta nao reconhecida'; end if;
    if lower(normalized_text) = lower(trim(current_belt)) then raise exception 'Valor solicitado igual ao atual'; end if;
    previous_payload := jsonb_build_object('faixa', current_belt);
    requested_payload := jsonb_build_object('faixa', normalized_text);
  elsif requested_field = 'peso' then
    begin
      requested_weight := replace(normalized_text, ',', '.')::numeric;
    exception
      when invalid_text_representation then
        raise exception 'Peso invalido';
    end;
    if requested_weight <= 0 then raise exception 'Peso invalido'; end if;
    if requested_weight is not distinct from current_weight then raise exception 'Valor solicitado igual ao atual'; end if;
    previous_payload := jsonb_build_object('peso_kg', current_weight);
    requested_payload := jsonb_build_object('peso_kg', requested_weight);
  elsif requested_field = 'equipe' then
    begin
      requested_team_id := normalized_text::uuid;
    exception
      when invalid_text_representation then
        raise exception 'Equipe invalida';
    end;
    select * into target_team from public.teams where id = requested_team_id for share;
    if not found then raise exception 'Equipe inexistente'; end if;
    if target_team.organization_id is distinct from current_athlete.organization_id then
      raise exception 'Equipe deve pertencer a mesma organizacao do atleta';
    end if;
    if requested_team_id is not distinct from current_team_id then raise exception 'Valor solicitado igual ao atual'; end if;
    previous_payload := jsonb_build_object('team_id', current_team_id, 'team_name', current_team_name);
    requested_payload := jsonb_build_object('team_id', target_team.id, 'team_name', target_team.nome);
  else
    raise exception 'Campo nao suportado';
  end if;

  insert into public.registration_correction_requests (
    registration_id, requested_by, requested_field, previous_value, requested_value, reason
  ) values (
    target_registration.id, actor, requested_field, previous_payload, requested_payload, normalized_reason
  ) returning id into new_request_id;

  insert into public.event_audit_logs (
    organization_id, event_id, actor_id, action, resource_type,
    resource_id, before_data, after_data, reason
  ) values (
    target_event.organization_id, target_event.id, actor,
    'registration_correction_requested', 'registration_correction_request', new_request_id,
    jsonb_build_object(
      'registrationId', target_registration.id,
      'field', requested_field,
      'previousValue', previous_payload
    ),
    jsonb_build_object(
      'registrationId', target_registration.id,
      'field', requested_field,
      'requestedValue', requested_payload,
      'status', 'pendente'
    ),
    normalized_reason
  );

  return jsonb_build_object('kind', 'requested', 'requestId', new_request_id);
end;
$$;

create or replace function public.review_registration_correction(
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
  change_request public.registration_correction_requests%rowtype;
  target_registration public.registrations%rowtype;
  target_event public.events%rowtype;
  current_athlete public.athletes%rowtype;
  current_category public.event_categories%rowtype;
  next_status public.change_request_status;
  next_snapshot jsonb;
  compatible boolean := true;
  master_synced boolean := false;
  previous_team_id uuid;
  next_team_id uuid;
begin
  if actor is null then raise exception 'Sessao obrigatoria'; end if;
  if approve_request is null then raise exception 'Decisao obrigatoria'; end if;

  select * into change_request
  from public.registration_correction_requests
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
  ) then raise exception 'Sem permissao para decidir correcao'; end if;

  perform public.assert_registration_correction_window(target_registration);

  if approve_request then
    next_status := 'aprovada';
    next_snapshot := target_registration.athlete_snapshot || change_request.requested_value;
    perform set_config('jiu.allow_registration_correction', '1', true);
    update public.registrations
    set athlete_snapshot = next_snapshot, updated_at = now()
    where id = target_registration.id;
    perform set_config('jiu.allow_registration_correction', '0', true);

    select * into target_registration from public.registrations where id = target_registration.id;
    select * into current_category
    from public.event_categories
    where id = public.registration_current_category_id(target_registration);
    if not found then
      compatible := false;
    else
      compatible := public.category_is_eligible_for_registration(
        target_registration, current_category, target_event.data_evento
      );
    end if;

    select * into current_athlete from public.athletes where id = target_registration.athlete_id for update;
    if found then
      previous_team_id := current_athlete.team_id;
      next_team_id := coalesce((change_request.requested_value->>'team_id')::uuid, current_athlete.team_id);
      if change_request.requested_field = 'equipe' then
        if not exists (
          select 1 from public.teams team
          where team.id = next_team_id and team.organization_id = current_athlete.organization_id
        ) then raise exception 'Equipe deve pertencer a mesma organizacao do atleta'; end if;
      end if;

      update public.athletes
      set nome_completo = coalesce(change_request.requested_value->>'nome_completo', nome_completo),
          faixa = coalesce(change_request.requested_value->>'faixa', faixa),
          peso_kg = coalesce((change_request.requested_value->>'peso_kg')::numeric, peso_kg),
          team_id = case
            when change_request.requested_field = 'equipe' then next_team_id
            else team_id
          end,
          updated_at = now()
      where id = current_athlete.id;
      master_synced := true;

      if change_request.requested_field = 'equipe' and previous_team_id is distinct from next_team_id then
        insert into public.event_audit_logs (
          organization_id, actor_id, action, resource_type, resource_id,
          before_data, after_data, reason
        ) values (
          current_athlete.organization_id, actor, 'athlete.team_changed', 'athlete', current_athlete.id,
          jsonb_build_object('team_id', previous_team_id),
          jsonb_build_object('team_id', next_team_id, 'registrationId', target_registration.id),
          coalesce(change_request.reason, 'Correcao de inscricao aprovada')
        );
      end if;
    end if;
  else
    next_status := 'recusada';
  end if;

  update public.registration_correction_requests
  set status = next_status,
      reviewed_by = actor,
      reviewed_at = now(),
      category_compatible = case when approve_request then compatible else null end
  where id = change_request.id;

  insert into public.event_audit_logs (
    organization_id, event_id, actor_id, action, resource_type,
    resource_id, before_data, after_data, reason
  ) values (
    target_event.organization_id, target_event.id, actor,
    case when approve_request then 'registration_correction_approved' else 'registration_correction_rejected' end,
    'registration_correction_request', change_request.id,
    jsonb_build_object(
      'registrationId', target_registration.id,
      'requesterId', change_request.requested_by,
      'field', change_request.requested_field,
      'previousValue', change_request.previous_value,
      'requestedValue', change_request.requested_value,
      'status', change_request.status
    ),
    jsonb_build_object(
      'registrationId', target_registration.id,
      'field', change_request.requested_field,
      'previousValue', change_request.previous_value,
      'requestedValue', change_request.requested_value,
      'status', next_status,
      'categoryCompatible', case when approve_request then to_jsonb(compatible) else 'null'::jsonb end,
      'masterAthleteSynced', master_synced,
      'categoryId', target_registration.category_id,
      'currentCategoryId', target_registration.current_category_id
    ),
    change_request.reason
  );

  return jsonb_build_object(
    'kind', 'reviewed',
    'requestId', change_request.id,
    'status', next_status,
    'categoryCompatible', case when approve_request then to_jsonb(compatible) else 'null'::jsonb end,
    'masterAthleteSynced', master_synced
  );
end;
$$;

revoke insert, update, delete on public.registration_correction_requests from authenticated, anon;
grant select on public.registration_correction_requests to authenticated;
grant usage on type public.registration_correction_field to authenticated;

revoke execute on function public.assert_registration_correction_window(public.registrations) from public, anon, authenticated;
revoke all on function public.request_registration_correction(uuid, public.registration_correction_field, text, text) from public, anon;
revoke all on function public.review_registration_correction(uuid, boolean) from public, anon;
grant execute on function public.request_registration_correction(uuid, public.registration_correction_field, text, text) to authenticated;
grant execute on function public.review_registration_correction(uuid, boolean) to authenticated;

commit;
