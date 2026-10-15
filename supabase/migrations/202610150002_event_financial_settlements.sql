-- Financeiro Lote 4: fechamento financeiro do evento cobrado da organizacao.
-- Politica comercial v1 congelada: R$ 8,00 por inscricao efetivada com pagamento pago.
-- Cobranca PIX no Asaas Sandbox (conta emissora) com split de 50% do liquido para a conta recebedora.
-- Fechamento emitido e imutavel: novas inscricoes pagas geram o fechamento seguinte.
-- Nao altera o fluxo do atleta, a taxa configurada por evento nem o motor percentual.
begin;

do $$
begin
  create type public.settlement_status as enum (
    'pendente_emissao', 'emitindo', 'aguardando_pagamento', 'reconciliacao', 'pago', 'cancelado'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.settlement_distribution_status as enum ('pendente', 'concluido', 'falhou');
exception
  when duplicate_object then null;
end $$;

-- Cliente Asaas da organizacao devedora da comissao. Somente o servidor le e escreve.
create table if not exists public.organization_billing_customers (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  provider text not null default 'asaas' check (provider = 'asaas'),
  gateway_customer_id text unique,
  state text not null check (state in ('claimed', 'ready', 'reconcile')),
  token uuid not null default gen_random_uuid(),
  claimed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (state <> 'ready' or gateway_customer_id is not null)
);

alter table public.organization_billing_customers enable row level security;
revoke all on public.organization_billing_customers from anon, authenticated;
grant select, insert, update, delete on public.organization_billing_customers to service_role;

create table if not exists public.event_financial_settlements (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete restrict,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  sequence_number integer not null check (sequence_number >= 1),
  status public.settlement_status not null default 'pendente_emissao',
  eligible_registration_count integer not null check (eligible_registration_count > 0),
  gross_confirmed_cents bigint not null check (gross_confirmed_cents >= 0),
  fee_type text not null check (fee_type = 'FIXED_PER_PAID_REGISTRATION'),
  fee_per_registration_cents integer not null check (fee_per_registration_cents > 0),
  platform_fee_gross_cents bigint not null,
  commercial_policy_snapshot jsonb not null,
  provider text not null default 'asaas' check (provider = 'asaas'),
  provider_customer_id text,
  provider_payment_id text unique,
  provider_external_reference text not null unique,
  provider_net_value_cents bigint check (provider_net_value_cents is null or provider_net_value_cents >= 0),
  split_recipient_wallet_id text,
  split_percent numeric(5,2) check (split_percent is null or (split_percent > 0 and split_percent <= 100)),
  split_id text,
  distribution_status public.settlement_distribution_status not null default 'pendente',
  distribution_provider_event_id text,
  distribution_done_at timestamptz,
  issue_token uuid,
  issue_claimed_at timestamptz,
  issued_at timestamptz,
  due_at date,
  paid_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, sequence_number),
  check (platform_fee_gross_cents = eligible_registration_count::bigint * fee_per_registration_cents),
  check (status <> 'pago' or (paid_at is not null and provider_payment_id is not null)),
  check (status not in ('aguardando_pagamento', 'pago') or provider_payment_id is not null),
  check (distribution_status <> 'concluido' or (split_id is not null and distribution_done_at is not null))
);

comment on table public.event_financial_settlements is
  'Fechamento financeiro cobrado da organizacao (comissao MEU CAMP). Valores congelados na criacao; escrita somente por RPC.';

create index if not exists event_financial_settlements_org_idx
  on public.event_financial_settlements (organization_id, created_at desc);

create table if not exists public.event_financial_settlement_items (
  settlement_id uuid not null references public.event_financial_settlements(id) on delete cascade,
  registration_id uuid not null unique references public.registrations(id) on delete restrict,
  payment_id uuid not null references public.payments(id) on delete restrict,
  gross_cents bigint not null check (gross_cents >= 0),
  fee_cents integer not null check (fee_cents > 0),
  created_at timestamptz not null default now(),
  primary key (settlement_id, registration_id)
);

comment on column public.event_financial_settlement_items.registration_id is
  'Unico em toda a tabela: uma inscricao paga entra em no maximo um fechamento.';

create index if not exists event_financial_settlement_items_payment_idx
  on public.event_financial_settlement_items (payment_id);

-- Imutabilidade: valores do fechamento e identidade da cobranca nao mudam depois de gravados.
create or replace function public.guard_event_financial_settlement()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.event_id is distinct from old.event_id
    or new.organization_id is distinct from old.organization_id
    or new.sequence_number is distinct from old.sequence_number
    or new.eligible_registration_count is distinct from old.eligible_registration_count
    or new.gross_confirmed_cents is distinct from old.gross_confirmed_cents
    or new.fee_type is distinct from old.fee_type
    or new.fee_per_registration_cents is distinct from old.fee_per_registration_cents
    or new.platform_fee_gross_cents is distinct from old.platform_fee_gross_cents
    or new.commercial_policy_snapshot is distinct from old.commercial_policy_snapshot
    or new.provider_external_reference is distinct from old.provider_external_reference
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at then
    raise exception 'Fechamento emitido e imutavel';
  end if;
  if old.provider_payment_id is not null and new.provider_payment_id is distinct from old.provider_payment_id then
    raise exception 'Cobranca do fechamento e imutavel';
  end if;
  if old.split_id is not null and new.split_id is distinct from old.split_id then
    raise exception 'Split do fechamento e imutavel';
  end if;
  if old.status in ('pago', 'cancelado') and new.status is distinct from old.status then
    raise exception 'Fechamento finalizado nao muda de estado';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists event_financial_settlements_guard on public.event_financial_settlements;
create trigger event_financial_settlements_guard
  before update on public.event_financial_settlements
  for each row execute function public.guard_event_financial_settlement();

create or replace function public.guard_event_financial_settlement_item()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Item de fechamento e imutavel';
end;
$$;

drop trigger if exists event_financial_settlement_items_guard on public.event_financial_settlement_items;
create trigger event_financial_settlement_items_guard
  before update on public.event_financial_settlement_items
  for each row execute function public.guard_event_financial_settlement_item();

alter table public.event_financial_settlements enable row level security;
alter table public.event_financial_settlement_items enable row level security;

drop policy if exists event_financial_settlements_staff_select on public.event_financial_settlements;
create policy event_financial_settlements_staff_select on public.event_financial_settlements for select
using (
  public.has_organization_role(
    organization_id,
    array['owner', 'organizer', 'finance']::public.organization_role[]
  )
);

drop policy if exists event_financial_settlement_items_staff_select on public.event_financial_settlement_items;
create policy event_financial_settlement_items_staff_select on public.event_financial_settlement_items for select
using (
  exists (
    select 1 from public.event_financial_settlements settlement
    where settlement.id = settlement_id
      and public.has_organization_role(
        settlement.organization_id,
        array['owner', 'organizer', 'finance']::public.organization_role[]
      )
  )
);

revoke all on public.event_financial_settlements from anon, authenticated;
revoke all on public.event_financial_settlement_items from anon, authenticated;
grant select on public.event_financial_settlements to authenticated;
grant select on public.event_financial_settlement_items to authenticated;
grant select, insert, update, delete on public.event_financial_settlements to service_role;
grant select, insert, update, delete on public.event_financial_settlement_items to service_role;

-- Papel de emissao avaliado para um ator explicito (chamadas do servidor com credencial privada).
create or replace function public.can_issue_event_settlement(target_organization_id uuid, actor uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select actor is not null and (
    exists (select 1 from public.platform_user_roles where user_id = actor and role = 'admin')
    or exists (
      select 1 from public.organization_members
      where organization_id = target_organization_id
        and user_id = actor
        and role in ('owner', 'organizer')
    )
  );
$$;

revoke all on function public.can_issue_event_settlement(uuid, uuid) from public, anon, authenticated;
grant execute on function public.can_issue_event_settlement(uuid, uuid) to service_role;

-- Cria o proximo fechamento do evento com as inscricoes pagas ainda nao fechadas.
create or replace function public.create_event_financial_settlement(target_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  actor uuid := auth.uid();
  target_event public.events%rowtype;
  fee_cents constant integer := 800;
  registration_ids uuid[];
  payment_ids uuid[];
  gross_values bigint[];
  item_count integer;
  gross_total bigint;
  next_sequence integer;
  new_id uuid := gen_random_uuid();
begin
  if actor is null then raise exception 'Sessao obrigatoria'; end if;
  if target_event_id is null then raise exception 'Evento obrigatorio'; end if;

  select * into target_event from public.events where id = target_event_id for update;
  if not found then raise exception 'Evento inexistente'; end if;
  if not public.can_issue_event_settlement(target_event.organization_id, actor) then
    raise exception 'Sem permissao para fechamento financeiro';
  end if;

  if exists (
    select 1 from public.payment_receipts receipt
    where receipt.event_id = target_event.id and receipt.status = 'em_analise'
  ) then
    raise exception 'Existem comprovantes em analise';
  end if;

  with eligible as (
    select distinct on (registration.id)
      registration.id as registration_id,
      payment.id as payment_id,
      round(link.amount * 100)::bigint as gross_cents
    from public.registrations registration
    join public.payment_registrations link on link.registration_id = registration.id
    join public.payments payment on payment.id = link.payment_id
    where registration.event_id = target_event.id
      and registration.status = 'efetivada'
      and payment.event_id = target_event.id
      and payment.status = 'pago'
      and not exists (
        select 1 from public.event_financial_settlement_items item
        where item.registration_id = registration.id
      )
    order by registration.id, payment.paid_at nulls last, payment.created_at
  )
  select
    coalesce(array_agg(registration_id order by registration_id), '{}'),
    coalesce(array_agg(payment_id order by registration_id), '{}'),
    coalesce(array_agg(gross_cents order by registration_id), '{}')
  into registration_ids, payment_ids, gross_values
  from eligible;

  item_count := coalesce(cardinality(registration_ids), 0);
  if item_count = 0 then
    raise exception 'Nenhuma inscricao paga pendente de fechamento';
  end if;
  select coalesce(sum(value), 0) into gross_total from unnest(gross_values) as value;

  select coalesce(max(sequence_number), 0) + 1 into next_sequence
  from public.event_financial_settlements
  where event_id = target_event.id;

  insert into public.event_financial_settlements (
    id, event_id, organization_id, sequence_number, status,
    eligible_registration_count, gross_confirmed_cents,
    fee_type, fee_per_registration_cents, platform_fee_gross_cents,
    commercial_policy_snapshot, provider_external_reference, created_by
  ) values (
    new_id, target_event.id, target_event.organization_id, next_sequence, 'pendente_emissao',
    item_count, gross_total,
    'FIXED_PER_PAID_REGISTRATION', fee_cents, item_count::bigint * fee_cents,
    jsonb_build_object(
      'policy', 'FIXED_PER_PAID_REGISTRATION',
      'version', 'v1',
      'valueCents', fee_cents,
      'currency', 'BRL',
      'basis', 'inscricao efetivada com pagamento pago'
    ),
    'meucamp:settlement:' || new_id::text,
    actor
  );

  insert into public.event_financial_settlement_items (settlement_id, registration_id, payment_id, gross_cents, fee_cents)
  select new_id, item.registration_id, item.payment_id, item.gross_cents, fee_cents
  from unnest(registration_ids, payment_ids, gross_values) as item(registration_id, payment_id, gross_cents);

  insert into public.event_audit_logs (
    organization_id, event_id, actor_id, action, resource_type, resource_id, after_data
  ) values (
    target_event.organization_id, target_event.id, actor,
    'event_financial_settlement_created', 'event_financial_settlement', new_id,
    jsonb_build_object(
      'sequenceNumber', next_sequence,
      'registrationCount', item_count,
      'feePerRegistrationCents', fee_cents,
      'platformFeeGrossCents', item_count::bigint * fee_cents,
      'grossConfirmedCents', gross_total
    )
  );

  return jsonb_build_object(
    'kind', 'event_financial_settlement',
    'settlementId', new_id,
    'sequenceNumber', next_sequence,
    'registrationCount', item_count,
    'platformFeeGrossCents', item_count::bigint * fee_cents
  );
end;
$fn$;

revoke all on function public.create_event_financial_settlement(uuid) from public, anon;
grant execute on function public.create_event_financial_settlement(uuid) to authenticated;

-- Cliente Asaas por organizacao: claim serial antes de qualquer POST externo.
create or replace function public.claim_organization_billing_customer(target_organization_id uuid, actor_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  job public.organization_billing_customers%rowtype;
  reference_value text;
begin
  if target_organization_id is null or not exists (select 1 from public.organizations where id = target_organization_id) then
    raise exception 'Organizacao invalida';
  end if;
  if not public.can_issue_event_settlement(target_organization_id, actor_id) then
    raise exception 'Sem permissao para fechamento financeiro';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('org-billing:' || target_organization_id::text, 0));
  reference_value := 'meucamp:org:' || target_organization_id::text;

  select * into job from public.organization_billing_customers where organization_id = target_organization_id for update;
  if not found then
    insert into public.organization_billing_customers(organization_id, state)
    values (target_organization_id, 'claimed') returning * into job;
    return jsonb_build_object('kind', 'claimed', 'token', job.token, 'reference', reference_value);
  end if;
  if job.state = 'ready' then
    return jsonb_build_object('kind', 'ready', 'customerId', job.gateway_customer_id);
  end if;
  if job.state = 'claimed' and job.claimed_at >= now() - interval '2 minutes' then
    return jsonb_build_object('kind', 'busy');
  end if;
  return jsonb_build_object('kind', 'reconcile', 'token', job.token, 'reference', reference_value);
end;
$$;

create or replace function public.complete_organization_billing_customer(
  target_organization_id uuid,
  claim_token uuid,
  gateway_id text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  job public.organization_billing_customers%rowtype;
begin
  if nullif(trim(gateway_id), '') is null or length(gateway_id) > 64 then raise exception 'Cliente Asaas invalido'; end if;
  select * into job from public.organization_billing_customers where organization_id = target_organization_id for update;
  if not found or job.token is distinct from claim_token or job.state not in ('claimed', 'reconcile') then
    raise exception 'Claim de cliente da organizacao invalido';
  end if;
  update public.organization_billing_customers
  set gateway_customer_id = gateway_id, state = 'ready', updated_at = now()
  where organization_id = target_organization_id;
end;
$$;

create or replace function public.flag_organization_billing_customer_reconciliation(target_organization_id uuid, claim_token uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.organization_billing_customers
  set state = 'reconcile', updated_at = now()
  where organization_id = target_organization_id and token = claim_token and state = 'claimed';
end;
$$;

revoke all on function public.claim_organization_billing_customer(uuid, uuid) from public, anon, authenticated;
revoke all on function public.complete_organization_billing_customer(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.flag_organization_billing_customer_reconciliation(uuid, uuid) from public, anon, authenticated;
grant execute on function public.claim_organization_billing_customer(uuid, uuid) to service_role;
grant execute on function public.complete_organization_billing_customer(uuid, uuid, text) to service_role;
grant execute on function public.flag_organization_billing_customer_reconciliation(uuid, uuid) to service_role;

-- Emissao da cobranca PIX do fechamento. O claim e persistido antes do POST no Asaas.
create or replace function public.claim_settlement_issuance(target_settlement_id uuid, actor_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  settlement public.event_financial_settlements%rowtype;
  event_name text;
  customer_id text;
  new_token uuid := gen_random_uuid();
  input_value jsonb;
begin
  select * into settlement from public.event_financial_settlements where id = target_settlement_id for update;
  if not found then raise exception 'Fechamento inexistente'; end if;
  if not public.can_issue_event_settlement(settlement.organization_id, actor_id) then
    raise exception 'Sem permissao para fechamento financeiro';
  end if;
  if settlement.status = 'cancelado' then raise exception 'Fechamento cancelado'; end if;

  select gateway_customer_id into customer_id
  from public.organization_billing_customers
  where organization_id = settlement.organization_id and state = 'ready';
  if customer_id is null then raise exception 'Cliente da organizacao indisponivel'; end if;

  if settlement.due_at is null then
    update public.event_financial_settlements
    set due_at = ((now() at time zone 'America/Sao_Paulo')::date + 3)
    where id = settlement.id
    returning * into settlement;
  end if;

  select nome into event_name from public.events where id = settlement.event_id;
  input_value := jsonb_build_object(
    'customerId', coalesce(settlement.provider_customer_id, customer_id),
    'reference', settlement.provider_external_reference,
    'totalCents', settlement.platform_fee_gross_cents,
    'method', 'pix',
    'dueDate', to_char(settlement.due_at, 'YYYY-MM-DD'),
    'description', left(
      'MEU CAMP - fechamento #' || settlement.sequence_number || ' - ' || coalesce(event_name, 'evento')
        || ' - ' || settlement.eligible_registration_count || ' inscricao(oes) x R$ 8,00',
      500
    )
  );

  if settlement.provider_payment_id is not null then
    return jsonb_build_object('kind', 'issued', 'gatewayId', settlement.provider_payment_id, 'input', input_value);
  end if;
  if settlement.status = 'reconciliacao' then
    return jsonb_build_object('kind', 'reconcile');
  end if;
  if settlement.status = 'emitindo' then
    if settlement.issue_claimed_at >= now() - interval '2 minutes' then
      return jsonb_build_object('kind', 'busy');
    end if;
    update public.event_financial_settlements set status = 'reconciliacao' where id = settlement.id;
    return jsonb_build_object('kind', 'reconcile');
  end if;
  if settlement.status <> 'pendente_emissao' then
    raise exception 'Fechamento nao esta apto para emissao';
  end if;

  update public.event_financial_settlements
  set status = 'emitindo', issue_token = new_token, issue_claimed_at = now()
  where id = settlement.id;
  return jsonb_build_object('kind', 'claimed', 'token', new_token, 'input', input_value);
end;
$$;

create or replace function public.complete_settlement_issuance(
  target_settlement_id uuid,
  claim_token uuid,
  gateway_id text,
  reference_value text,
  amount_value numeric,
  wallet_id text,
  percent_value numeric,
  split_value text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  settlement public.event_financial_settlements%rowtype;
  customer_id text;
begin
  if nullif(trim(gateway_id), '') is null or length(gateway_id) > 64 then raise exception 'Cobranca invalida'; end if;
  if nullif(trim(wallet_id), '') is null or length(wallet_id) > 64 then raise exception 'Wallet de split invalida'; end if;
  if percent_value is distinct from 50 then raise exception 'Percentual de split invalido'; end if;
  select * into settlement from public.event_financial_settlements where id = target_settlement_id for update;
  if not found or settlement.issue_token is distinct from claim_token or settlement.status not in ('emitindo', 'reconciliacao') then
    raise exception 'Claim de emissao invalido';
  end if;
  if reference_value is distinct from settlement.provider_external_reference
    or round(amount_value * 100)::bigint is distinct from settlement.platform_fee_gross_cents then
    raise exception 'Cobranca divergente do fechamento';
  end if;
  select gateway_customer_id into customer_id
  from public.organization_billing_customers where organization_id = settlement.organization_id;

  update public.event_financial_settlements
  set status = 'aguardando_pagamento',
      provider_payment_id = gateway_id,
      provider_customer_id = customer_id,
      split_recipient_wallet_id = wallet_id,
      split_percent = percent_value,
      split_id = nullif(trim(split_value), ''),
      issued_at = now()
  where id = settlement.id;

  insert into public.event_audit_logs (
    organization_id, event_id, actor_id, action, resource_type, resource_id, after_data
  ) values (
    settlement.organization_id, settlement.event_id, null,
    'event_financial_settlement_issued', 'event_financial_settlement', settlement.id,
    jsonb_build_object(
      'provider', 'asaas',
      'providerPaymentId', gateway_id,
      'amountCents', settlement.platform_fee_gross_cents,
      'splitPercent', percent_value,
      'splitWalletEnding', right(wallet_id, 4)
    )
  );
end;
$$;

create or replace function public.release_settlement_issuance_claim(target_settlement_id uuid, claim_token uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.event_financial_settlements
  set status = 'pendente_emissao', issue_token = null, issue_claimed_at = null
  where id = target_settlement_id and issue_token = claim_token and status = 'emitindo' and provider_payment_id is null;
end;
$$;

create or replace function public.flag_settlement_issuance_reconciliation(target_settlement_id uuid, claim_token uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.event_financial_settlements
  set status = 'reconciliacao'
  where id = target_settlement_id and issue_token = claim_token and status = 'emitindo';
end;
$$;

revoke all on function public.claim_settlement_issuance(uuid, uuid) from public, anon, authenticated;
revoke all on function public.complete_settlement_issuance(uuid, uuid, text, text, numeric, text, numeric, text) from public, anon, authenticated;
revoke all on function public.release_settlement_issuance_claim(uuid, uuid) from public, anon, authenticated;
revoke all on function public.flag_settlement_issuance_reconciliation(uuid, uuid) from public, anon, authenticated;
grant execute on function public.claim_settlement_issuance(uuid, uuid) to service_role;
grant execute on function public.complete_settlement_issuance(uuid, uuid, text, text, numeric, text, numeric, text) to service_role;
grant execute on function public.release_settlement_issuance_claim(uuid, uuid) to service_role;
grant execute on function public.flag_settlement_issuance_reconciliation(uuid, uuid) to service_role;

-- Webhook de cobranca de fechamento (referencia meucamp:settlement:*).
-- Recebimento so vem do provedor; split concluido so com evidencia do provedor.
create or replace function public.process_settlement_webhook(target_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  webhook public.webhook_events%rowtype;
  settlement public.event_financial_settlements%rowtype;
  payload jsonb;
  v_event text;
  v_payment_id text;
  v_reference text;
  v_status text;
  v_billing text;
  v_value numeric(12,2);
  v_net numeric(12,2);
  v_split text;
begin
  select * into webhook from public.webhook_events where id = target_event_id for update;
  if not found then raise exception 'Evento de webhook inexistente'; end if;
  if webhook.status in ('processado', 'ignorado') then
    return jsonb_build_object('kind', 'duplicate');
  end if;

  payload := webhook.payload;
  v_event := nullif(trim(payload->>'event'), '');
  v_payment_id := nullif(trim(payload->'payment'->>'id'), '');
  v_reference := nullif(trim(payload->'payment'->>'externalReference'), '');
  v_status := nullif(trim(payload->'payment'->>'status'), '');
  v_billing := nullif(trim(payload->'payment'->>'billingType'), '');
  v_split := nullif(trim(payload->'additionalInfo'->>'splitId'), '');
  begin
    v_value := (payload->'payment'->>'value')::numeric(12,2);
    v_net := (payload->'payment'->>'netValue')::numeric(12,2);
  exception when others then
    v_value := null;
    v_net := null;
  end;

  if v_event is null or v_payment_id is null or v_reference is null or v_reference not like 'meucamp:settlement:%' then
    update public.webhook_events set status = 'falhou', last_error = 'Payload de fechamento invalido', attempts = attempts + 1 where id = target_event_id;
    return jsonb_build_object('kind', 'review');
  end if;

  select * into settlement from public.event_financial_settlements
  where provider_external_reference = v_reference for update;
  if not found or settlement.provider_payment_id is distinct from v_payment_id then
    update public.webhook_events set status = 'falhou', last_error = 'Fechamento ou cobranca divergente', attempts = attempts + 1 where id = target_event_id;
    return jsonb_build_object('kind', 'review');
  end if;

  if v_event = 'PAYMENT_RECEIVED' then
    if v_status is distinct from 'RECEIVED' or v_billing is distinct from 'PIX'
      or v_value is null or round(v_value * 100)::bigint is distinct from settlement.platform_fee_gross_cents then
      update public.webhook_events set status = 'falhou', last_error = 'Recebimento divergente do fechamento', attempts = attempts + 1 where id = target_event_id;
      return jsonb_build_object('kind', 'review');
    end if;
    if settlement.status = 'aguardando_pagamento' then
      update public.event_financial_settlements
      set status = 'pago',
          paid_at = now(),
          provider_net_value_cents = case when v_net is not null and v_net > 0 then round(v_net * 100)::bigint else null end
      where id = settlement.id;
      insert into public.event_audit_logs (
        organization_id, event_id, actor_id, action, resource_type, resource_id, before_data, after_data
      ) values (
        settlement.organization_id, settlement.event_id, null,
        'event_financial_settlement_paid', 'event_financial_settlement', settlement.id,
        jsonb_build_object('status', settlement.status),
        jsonb_build_object('status', 'pago', 'providerEventId', webhook.external_event_id, 'netValueCents',
          case when v_net is not null and v_net > 0 then round(v_net * 100)::bigint else null end)
      );
    elsif settlement.status <> 'pago' then
      update public.webhook_events set status = 'falhou', last_error = 'Estado do fechamento incompativel com recebimento', attempts = attempts + 1 where id = target_event_id;
      return jsonb_build_object('kind', 'review');
    end if;
  elsif v_event = 'PAYMENT_SPLIT_DONE' then
    if v_split is null then
      update public.webhook_events set status = 'falhou', last_error = 'Split sem identificador', attempts = attempts + 1 where id = target_event_id;
      return jsonb_build_object('kind', 'review');
    end if;
    if settlement.split_id is not null and settlement.split_id is distinct from v_split then
      update public.webhook_events set status = 'falhou', last_error = 'Split divergente do fechamento', attempts = attempts + 1 where id = target_event_id;
      return jsonb_build_object('kind', 'review');
    end if;
    if settlement.status not in ('aguardando_pagamento', 'pago') then
      update public.webhook_events set status = 'falhou', last_error = 'Estado do fechamento incompativel com split', attempts = attempts + 1 where id = target_event_id;
      return jsonb_build_object('kind', 'review');
    end if;
    if settlement.distribution_status <> 'concluido' then
      update public.event_financial_settlements
      set distribution_status = 'concluido',
          split_id = v_split,
          distribution_provider_event_id = webhook.external_event_id,
          distribution_done_at = now()
      where id = settlement.id;
      insert into public.event_audit_logs (
        organization_id, event_id, actor_id, action, resource_type, resource_id, after_data
      ) values (
        settlement.organization_id, settlement.event_id, null,
        'event_financial_settlement_split_done', 'event_financial_settlement', settlement.id,
        jsonb_build_object('splitId', v_split, 'providerEventId', webhook.external_event_id, 'splitPercent', settlement.split_percent)
      );
    end if;
  else
    update public.webhook_events
    set status = 'ignorado', processed_at = now(), last_error = 'Evento de fechamento sem transicao automatica', attempts = attempts + 1
    where id = target_event_id;
    return jsonb_build_object('kind', 'ignored');
  end if;

  update public.webhook_events set status = 'processado', processed_at = now(), last_error = null, attempts = attempts + 1 where id = target_event_id;
  return jsonb_build_object('kind', 'processed', 'settlementId', settlement.id, 'event', v_event);
exception when others then
  update public.webhook_events set status = 'falhou', last_error = left(sqlerrm, 1000), attempts = attempts + 1 where id = target_event_id;
  return jsonb_build_object('kind', 'failed');
end;
$$;

revoke all on function public.process_settlement_webhook(uuid) from public, anon, authenticated;
grant execute on function public.process_settlement_webhook(uuid) to service_role;

commit;
