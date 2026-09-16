-- Manual settlement is an exceptional financial operation. It is atomic,
-- restricted to event owners/organizers or platform admins, and always audited.
begin;

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

  update public.registrations
  set status = 'efetivada', updated_at = now()
  where id in (
    select registration_id from public.payment_registrations
    where payment_id = payment_record.id
  );

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
    jsonb_build_object('status', 'pago', 'registrationStatus', 'efetivada', 'source', 'manual'),
    normalized_reason
  );

  return jsonb_build_object(
    'kind', 'settled',
    'paymentId', payment_record.id,
    'registrationCount', registration_count
  );
end;
$$;

revoke all on function public.settle_payment_manually(uuid, text) from public, anon;
grant execute on function public.settle_payment_manually(uuid, text) to authenticated;

commit;
