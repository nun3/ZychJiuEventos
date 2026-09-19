-- Sprint 12 lote 2: taxa MEU CAMP fixa por inscricao efetivada, contratada por evento.
-- A taxa nao fica em public.events porque anon possui select na tabela e eventos
-- publicados sao publicos; o valor contratado nao pode vazar na consulta publica.
-- O historico fica no vinculo financeiro: alterar a taxa depois nao altera inscricao efetivada.
begin;

create table if not exists public.event_platform_fees (
  event_id uuid primary key references public.events(id) on delete cascade,
  fee_cents integer not null default 0 check (fee_cents >= 0 and fee_cents <= 99999999),
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

comment on table public.event_platform_fees is
  'Taxa MEU CAMP fixa por inscricao efetivada, em centavos, contratada por evento. Somente platform admin altera; owner, organizer e finance consultam. Ausencia de linha significa zero.';

alter table public.event_platform_fees enable row level security;

drop policy if exists event_platform_fees_staff_select on public.event_platform_fees;
create policy event_platform_fees_staff_select on public.event_platform_fees for select
using (
  public.is_platform_admin() or exists (
    select 1 from public.events event_row
    where event_row.id = event_id
      and public.has_organization_role(
        event_row.organization_id,
        array['owner','organizer','finance']::public.organization_role[]
      )
  )
);

revoke all on public.event_platform_fees from anon, authenticated;
grant select on public.event_platform_fees to authenticated;

alter table public.payment_registrations
  add column if not exists platform_fee_cents integer
  check (platform_fee_cents is null or (platform_fee_cents >= 0 and platform_fee_cents <= 99999999));

comment on column public.payment_registrations.platform_fee_cents is
  'Snapshot da taxa MEU CAMP aplicada quando esta inscricao foi efetivada. Nulo quando ainda nao houve efetivacao valida. Alterar a taxa do evento nao reescreve este valor.';

create or replace function public.set_event_platform_fee(
  target_event_id uuid,
  fee_cents integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  actor uuid := auth.uid();
  target_event public.events%rowtype;
  previous integer;
begin
  if actor is null then raise exception 'Sessao obrigatoria'; end if;
  if target_event_id is null then raise exception 'Evento obrigatorio'; end if;
  if fee_cents is null or fee_cents < 0 or fee_cents > 99999999 then
    raise exception 'Taxa da plataforma invalida';
  end if;
  if not public.is_platform_admin() then
    raise exception 'Somente a plataforma configura a taxa';
  end if;

  select * into target_event from public.events where id = target_event_id for share;
  if not found then raise exception 'Evento inexistente'; end if;

  select fee.fee_cents into previous
    from public.event_platform_fees fee
   where fee.event_id = target_event.id;

  insert into public.event_platform_fees (event_id, fee_cents, updated_by, updated_at)
  values (target_event.id, fee_cents, actor, now())
  on conflict (event_id) do update
    set fee_cents = excluded.fee_cents,
        updated_by = excluded.updated_by,
        updated_at = excluded.updated_at;

  insert into public.event_audit_logs (
    organization_id, event_id, actor_id, action, resource_type,
    resource_id, before_data, after_data
  ) values (
    target_event.organization_id, target_event.id, actor,
    'event_platform_fee_updated', 'event', target_event.id,
    jsonb_build_object('feeCents', previous),
    jsonb_build_object('feeCents', fee_cents)
  );

  return jsonb_build_object(
    'kind', 'platform_fee',
    'eventId', target_event.id,
    'feeCents', fee_cents
  );
end;
$fn$;

revoke all on function public.set_event_platform_fee(uuid, integer) from public, anon;
grant execute on function public.set_event_platform_fee(uuid, integer) to authenticated;

-- Baixa manual passa a congelar a taxa vigente na efetivacao.
create or replace function public.settle_payment_manually(
  target_payment_id uuid,
  reason_text text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  payment_record public.payments%rowtype;
  event_record public.events%rowtype;
  normalized_reason text := trim(coalesce(reason_text, ''));
  registration_count integer;
  fee_snapshot integer;
begin
  if actor is null then raise exception 'Sessao obrigatoria'; end if;
  if length(normalized_reason) < 10 or length(normalized_reason) > 500 then
    raise exception 'Justificativa deve ter entre 10 e 500 caracteres';
  end if;

  select * into payment_record from public.payments
  where id = target_payment_id for update;
  if not found then raise exception 'Pagamento inexistente'; end if;

  select * into event_record from public.events
  where id = payment_record.event_id for share;
  if not public.is_platform_admin() and not exists (
    select 1 from public.organization_members member
    where member.organization_id = event_record.organization_id
      and member.user_id = actor
      and member.role in ('owner', 'organizer')
  ) then
    raise exception 'Sem permissao para baixa manual';
  end if;

  if payment_record.status <> 'aguardando' then
    raise exception 'Pagamento nao esta aguardando baixa';
  end if;

  select count(*) into registration_count
  from public.payment_registrations link
  join public.registrations registration on registration.id = link.registration_id
  where link.payment_id = payment_record.id
    and registration.event_id = payment_record.event_id
    and registration.status = 'pendente_pagamento';

  if registration_count = 0 or registration_count <> (
    select count(*) from public.payment_registrations where payment_id = payment_record.id
  ) then
    raise exception 'Inscricoes vinculadas nao estao aptas para baixa';
  end if;

  select coalesce(fee.fee_cents, 0) into fee_snapshot
  from public.events target
  left join public.event_platform_fees fee on fee.event_id = target.id
  where target.id = payment_record.event_id;
  fee_snapshot := coalesce(fee_snapshot, 0);

  update public.registrations
  set status = 'efetivada', updated_at = now()
  where id in (
    select registration_id from public.payment_registrations
    where payment_id = payment_record.id
  );

  update public.payment_registrations
  set platform_fee_cents = fee_snapshot
  where payment_id = payment_record.id;

  update public.payments
  set status = 'pago', paid_at = now(), updated_at = now()
  where id = payment_record.id;

  insert into public.event_audit_logs (
    organization_id, event_id, actor_id, action, resource_type,
    resource_id, before_data, after_data, reason
  ) values (
    event_record.organization_id, event_record.id, actor,
    'payment_manually_settled', 'payment', payment_record.id,
    jsonb_build_object('status', payment_record.status, 'registrationCount', registration_count),
    jsonb_build_object(
      'status', 'pago',
      'registrationStatus', 'efetivada',
      'source', 'manual',
      'platformFeeCents', fee_snapshot
    ),
    normalized_reason
  );

  return jsonb_build_object(
    'kind', 'settled',
    'paymentId', payment_record.id,
    'registrationCount', registration_count,
    'platformFeeCents', fee_snapshot
  );
end;
$$;

revoke all on function public.settle_payment_manually(uuid, text) from public, anon;
grant execute on function public.settle_payment_manually(uuid, text) to authenticated;

-- Recebimento confirmado pelo gateway congela a mesma taxa vigente.
create or replace function public.process_payment_webhook(target_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  webhook public.webhook_events%rowtype;
  payment_record public.payments%rowtype;
  attempt_record public.payment_attempts%rowtype;
  payload jsonb;
  v_gateway_payment_id text;
  v_reference_value text;
  v_event_name text;
  v_gateway_status text;
  v_billing_type text;
  v_amount_value numeric(12,2);
  next_status public.payment_status;
  registration_record record;
  fee_snapshot integer;
begin
  select * into webhook from public.webhook_events where id = target_event_id for update;
  if not found then raise exception 'Evento de webhook inexistente'; end if;
  if webhook.status in ('processado', 'ignorado') then
    return jsonb_build_object('kind', 'duplicate');
  end if;
  if webhook.gateway <> 'asaas' then
    update public.webhook_events set status = 'ignorado', processed_at = now(), attempts = attempts + 1 where id = target_event_id;
    return jsonb_build_object('kind', 'ignored');
  end if;

  payload := webhook.payload;
  v_gateway_payment_id := nullif(trim(payload->'payment'->>'id'), '');
  v_reference_value := nullif(trim(payload->'payment'->>'externalReference'), '');
  v_event_name := nullif(trim(payload->>'event'), '');
  v_gateway_status := nullif(trim(payload->'payment'->>'status'), '');
  v_billing_type := nullif(trim(payload->'payment'->>'billingType'), '');
  begin
    v_amount_value := (payload->'payment'->>'value')::numeric(12,2);
  exception when others then
    v_amount_value := null;
  end;

  if v_gateway_payment_id is null or v_reference_value is null or v_event_name is null or v_gateway_status is null
    or v_billing_type not in ('PIX', 'BOLETO') or v_amount_value is null or v_amount_value <= 0 then
    update public.webhook_events set status = 'falhou', last_error = 'Payload de cobranca invalido', attempts = attempts + 1 where id = target_event_id;
    return jsonb_build_object('kind', 'review');
  end if;

  select * into payment_record from public.payments
  where gateway = 'asaas' and external_reference = v_reference_value for update;
  if not found or payment_record.valor_total is distinct from v_amount_value
    or payment_record.metodo is distinct from (case when v_billing_type = 'PIX' then 'pix'::public.payment_method else 'boleto'::public.payment_method end) then
    update public.webhook_events set status = 'falhou', last_error = 'Referencia, valor ou metodo divergente', attempts = attempts + 1 where id = target_event_id;
    return jsonb_build_object('kind', 'review');
  end if;

  select * into attempt_record from public.payment_attempts
  where payment_id = payment_record.id and payment_attempts.gateway_payment_id = v_gateway_payment_id
  for update;
  if not found then
    update public.webhook_events set status = 'falhou', last_error = 'Tentativa de pagamento divergente', attempts = attempts + 1 where id = target_event_id;
    return jsonb_build_object('kind', 'review');
  end if;

  if v_gateway_status = 'RECEIVED' and v_event_name = 'PAYMENT_RECEIVED' then
    if payment_record.status = 'aguardando' then
      if not exists (
        select 1 from public.payment_registrations pr where pr.payment_id = payment_record.id
      ) then
        update public.webhook_events set status = 'falhou', last_error = 'Pagamento sem inscricoes', attempts = attempts + 1 where id = target_event_id;
        return jsonb_build_object('kind', 'review');
      end if;
      for registration_record in
        select r.id, r.status from public.registrations r
        join public.payment_registrations pr on pr.registration_id = r.id
        where pr.payment_id = payment_record.id for update
      loop
        if registration_record.status <> 'pendente_pagamento' then
          update public.webhook_events set status = 'falhou', last_error = 'Inscricao nao esta pendente', attempts = attempts + 1 where id = target_event_id;
          return jsonb_build_object('kind', 'review');
        end if;
      end loop;
      select coalesce(fee.fee_cents, 0) into fee_snapshot
      from public.events target
      left join public.event_platform_fees fee on fee.event_id = target.id
      where target.id = payment_record.event_id;
      fee_snapshot := coalesce(fee_snapshot, 0);
      update public.registrations r set status = 'efetivada', updated_at = now()
      where r.id in (select registration_id from public.payment_registrations where payment_id = payment_record.id);
      update public.payment_registrations set platform_fee_cents = fee_snapshot where payment_id = payment_record.id;
      update public.payments set status = 'pago', paid_at = now(), updated_at = now() where id = payment_record.id;
      update public.payment_attempts set status = 'pago', updated_at = now() where id = attempt_record.id;
    elsif payment_record.status <> 'pago' then
      update public.webhook_events set status = 'falhou', last_error = 'Estado local incompatível com recebimento', attempts = attempts + 1 where id = target_event_id;
      return jsonb_build_object('kind', 'review');
    end if;
    next_status := 'pago';
  elsif v_gateway_status = 'OVERDUE' and v_event_name = 'PAYMENT_OVERDUE' then
    if payment_record.status = 'aguardando' then
      update public.payments set status = 'expirado', updated_at = now() where id = payment_record.id;
      update public.payment_attempts set status = 'expirado', updated_at = now() where id = attempt_record.id;
      update public.registrations set status = 'expirada', updated_at = now()
      where id in (select registration_id from public.payment_registrations where payment_id = payment_record.id)
        and status = 'pendente_pagamento';
    elsif payment_record.status <> 'expirado' then
      update public.webhook_events set status = 'falhou', last_error = 'Estado local incompatível com vencimento', attempts = attempts + 1 where id = target_event_id;
      return jsonb_build_object('kind', 'review');
    end if;
    next_status := 'expirado';
  elsif v_gateway_status = 'DELETED' and v_event_name = 'PAYMENT_DELETED' then
    if payment_record.status = 'aguardando' then
      update public.payments set status = 'cancelado', updated_at = now() where id = payment_record.id;
      update public.payment_attempts set status = 'cancelado', updated_at = now() where id = attempt_record.id;
    elsif payment_record.status <> 'cancelado' then
      update public.webhook_events set status = 'falhou', last_error = 'Estado local incompatível com cancelamento', attempts = attempts + 1 where id = target_event_id;
      return jsonb_build_object('kind', 'review');
    end if;
    next_status := 'cancelado';
  elsif v_gateway_status = 'REFUNDED' and v_event_name = 'PAYMENT_REFUNDED' then
    if payment_record.status = 'pago' then
      update public.payments set status = 'estornado', updated_at = now() where id = payment_record.id;
      update public.payment_attempts set status = 'estornado', updated_at = now() where id = attempt_record.id;
      update public.registrations set status = 'estornada', updated_at = now()
      where id in (select registration_id from public.payment_registrations where payment_id = payment_record.id)
        and status = 'efetivada';
    elsif payment_record.status <> 'estornado' then
      update public.webhook_events set status = 'falhou', last_error = 'Estado local incompatível com estorno', attempts = attempts + 1 where id = target_event_id;
      return jsonb_build_object('kind', 'review');
    end if;
    next_status := 'estornado';
  else
    update public.webhook_events set status = 'falhou', last_error = 'Evento exige conciliacao', attempts = attempts + 1 where id = target_event_id;
    return jsonb_build_object('kind', 'review');
  end if;

  update public.webhook_events set status = 'processado', processed_at = now(), last_error = null, attempts = attempts + 1 where id = target_event_id;
  return jsonb_build_object('kind', 'processed', 'paymentId', payment_record.id, 'status', next_status);
exception when others then
  update public.webhook_events set status = 'falhou', last_error = left(sqlerrm, 1000), attempts = attempts + 1 where id = target_event_id;
  return jsonb_build_object('kind', 'failed');
end;
$$;

revoke all on function public.process_payment_webhook(uuid) from public, anon, authenticated;
grant execute on function public.process_payment_webhook(uuid) to service_role;

commit;
