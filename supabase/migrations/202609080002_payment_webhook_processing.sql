begin;

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
      update public.registrations r set status = 'efetivada', updated_at = now()
      where r.id in (select registration_id from public.payment_registrations where payment_id = payment_record.id);
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
