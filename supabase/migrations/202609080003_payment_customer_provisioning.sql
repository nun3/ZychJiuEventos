-- Serializes Asaas customer provisioning per user. No browser role can call these functions.
begin;

create table public.payment_customer_provisioning (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  state text not null check (state in ('claimed', 'ready', 'reconcile')),
  token uuid not null default gen_random_uuid(),
  claimed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payment_customer_provisioning enable row level security;
revoke all on public.payment_customer_provisioning from anon, authenticated;
grant select, insert, update, delete on public.payment_customer_provisioning to service_role;

create or replace function public.claim_payment_customer(actor_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  job public.payment_customer_provisioning%rowtype;
  customer_id text;
  reference_value text;
begin
  if actor_id is null or not exists (select 1 from public.profiles where id = actor_id) then
    raise exception 'Pagador invalido';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(actor_id::text, 0));
  reference_value := 'meucamp:user:' || actor_id::text;

  select gateway_customer_id into customer_id from public.payment_customers where user_id = actor_id;
  if customer_id is not null then
    return jsonb_build_object('kind', 'ready', 'customerId', customer_id);
  end if;

  select * into job from public.payment_customer_provisioning where user_id = actor_id for update;
  if not found then
    insert into public.payment_customer_provisioning(user_id, state)
    values (actor_id, 'claimed') returning * into job;
    return jsonb_build_object('kind', 'claimed', 'token', job.token, 'reference', reference_value);
  end if;
  if job.state = 'claimed' and job.claimed_at >= now() - interval '2 minutes' then
    return jsonb_build_object('kind', 'busy');
  end if;
  return jsonb_build_object('kind', 'reconcile', 'token', job.token, 'reference', reference_value);
end;
$$;

create or replace function public.complete_payment_customer(
  actor_id uuid,
  claim_token uuid,
  gateway_id text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  job public.payment_customer_provisioning%rowtype;
  current_customer text;
begin
  if nullif(trim(gateway_id), '') is null then raise exception 'Cliente Asaas invalido'; end if;
  select * into job from public.payment_customer_provisioning where user_id = actor_id for update;
  if not found or job.token is distinct from claim_token or job.state not in ('claimed', 'reconcile') then
    raise exception 'Claim de pagador invalido';
  end if;
  select gateway_customer_id into current_customer from public.payment_customers where user_id = actor_id;
  if current_customer is not null and current_customer is distinct from gateway_id then
    raise exception 'Pagador possui cliente Asaas divergente';
  end if;
  insert into public.payment_customers(user_id, gateway_customer_id)
  values (actor_id, gateway_id)
  on conflict (user_id) do nothing;
  update public.payment_customer_provisioning set state = 'ready', updated_at = now() where user_id = actor_id;
end;
$$;

create or replace function public.flag_payment_customer_reconciliation(actor_id uuid, claim_token uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.payment_customer_provisioning
  set state = 'reconcile', updated_at = now()
  where user_id = actor_id and token = claim_token and state = 'claimed';
end;
$$;

revoke all on function public.claim_payment_customer(uuid) from public, anon, authenticated;
revoke all on function public.complete_payment_customer(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.flag_payment_customer_reconciliation(uuid, uuid) from public, anon, authenticated;
grant execute on function public.claim_payment_customer(uuid) to service_role;
grant execute on function public.complete_payment_customer(uuid, uuid, text) to service_role;
grant execute on function public.flag_payment_customer_reconciliation(uuid, uuid) to service_role;

commit;
