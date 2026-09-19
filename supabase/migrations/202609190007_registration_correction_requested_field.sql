-- Ajuste: requested_field era ambiguo na RPC ja aplicada no Sandbox.
-- Nao recria tipo/tabela. Nao reexecute 202609190006.
begin;

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
      and request.requested_field = request_registration_correction.requested_field
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
    target_registration.id, actor, request_registration_correction.requested_field, previous_payload, requested_payload, normalized_reason
  ) returning id into new_request_id;

  insert into public.event_audit_logs (
    organization_id, event_id, actor_id, action, resource_type,
    resource_id, before_data, after_data, reason
  ) values (
    target_event.organization_id, target_event.id, actor,
    'registration_correction_requested', 'registration_correction_request', new_request_id,
    jsonb_build_object(
      'registrationId', target_registration.id,
      'field', request_registration_correction.requested_field,
      'previousValue', previous_payload
    ),
    jsonb_build_object(
      'registrationId', target_registration.id,
      'field', request_registration_correction.requested_field,
      'requestedValue', requested_payload,
      'status', 'pendente'
    ),
    normalized_reason
  );

  return jsonb_build_object('kind', 'requested', 'requestId', new_request_id);
end;
$$;

revoke all on function public.request_registration_correction(uuid, public.registration_correction_field, text, text) from public, anon;
grant execute on function public.request_registration_correction(uuid, public.registration_correction_field, text, text) to authenticated;

commit;
