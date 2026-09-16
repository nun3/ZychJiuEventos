-- Internal persistence for charge issuance. No browser may call these functions.
begin;

create table public.payment_customers (
  user_id uuid primary key references public.profiles(id),
  gateway_customer_id text not null unique check (length(trim(gateway_customer_id)) > 0),
  created_at timestamptz not null default now()
);
create table public.payment_issuance_jobs (
  payment_id uuid primary key references public.payments(id),
  state text not null check (state in ('claimed', 'issued', 'reconcile')),
  token uuid not null default gen_random_uuid(),
  claimed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.payment_customers enable row level security;
alter table public.payment_issuance_jobs enable row level security;
revoke all on public.payment_customers, public.payment_issuance_jobs from anon, authenticated;
grant select, insert, update, delete on public.payment_customers, public.payment_issuance_jobs to service_role;

create or replace function public.claim_payment_issuance(target_payment_id uuid, actor_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  p public.payments%rowtype;
  e public.events%rowtype;
  j public.payment_issuance_jobs%rowtype;
  customer_id text;
  gateway_id text;
  deadline timestamptz;
  starts_at timestamptz;
  input_data jsonb;
begin
  select * into p from public.payments where id=target_payment_id;
  if not found or actor_id is null or p.created_by<>actor_id then raise exception 'Pagamento sem permissao'; end if;
  select * into e from public.events where id=p.event_id for share;
  select * into p from public.payments where id=target_payment_id for update;
  if p.status<>'aguardando' or p.gateway<>'asaas' or p.metodo not in ('pix','boleto') then raise exception 'Pagamento indisponivel'; end if;
  if not exists(select 1 from public.payment_registrations pr where pr.payment_id=p.id)
    or exists(
      select 1 from public.payment_registrations pr
      join public.registrations r on r.id=pr.registration_id
      join public.athletes a on a.id=r.athlete_id
      where pr.payment_id=p.id and (
        r.event_id<>p.event_id or r.status<>'pendente_pagamento' or
        not (a.user_id is not distinct from actor_id or exists(
          select 1 from public.athlete_managers am where am.athlete_id=a.id and am.manager_id=actor_id))
      )
    ) then raise exception 'Inscricao indisponivel ou sem permissao'; end if;
  select gateway_customer_id into customer_id from public.payment_customers where user_id=actor_id;
  if customer_id is null then raise exception 'Pagador nao configurado'; end if;
  select inicio,fim into starts_at,deadline from public.event_phases where event_id=e.id and tipo='pagamento';
  if deadline is null then raise exception 'Prazo de pagamento nao configurado'; end if;
  input_data := jsonb_build_object(
    'customerId',customer_id,'reference',p.external_reference,'totalCents',p.valor_total*100,
    'method',p.metodo,'dueDate',to_char(deadline at time zone e.timezone,'YYYY-MM-DD'),'description','Inscricoes Meu Camp'
  );
  select * into j from public.payment_issuance_jobs where payment_id=p.id;
  if found then
    if j.state='issued' then
      select gateway_payment_id into strict gateway_id from public.payment_attempts where payment_id=p.id;
      return jsonb_build_object('kind','issued','gatewayId',gateway_id,'input',input_data);
    end if;
    -- An abandoned process may have created the charge. Never reset to fresh.
    return jsonb_build_object('kind',case when j.state='reconcile' or j.claimed_at<now()-interval '2 minutes' then 'reconcile' else 'busy' end);
  end if;
  if e.status<>'pagamento' or now()<starts_at or now()>deadline then raise exception 'Fora do prazo de pagamento'; end if;
  if p.external_reference is null then raise exception 'Referencia ausente'; end if;
  insert into public.payment_issuance_jobs(payment_id,state) values(p.id,'claimed') returning * into j;
  update public.payments set data_expiracao=deadline where id=p.id;
  return jsonb_build_object('kind','claimed','token',j.token,'input',input_data);
end;
$$;

create or replace function public.complete_payment_issuance(
  target_payment_id uuid, claim_token uuid, gateway_id text,
  reference_value text, amount_value numeric, method_value public.payment_method, boleto_value text
)
returns void language plpgsql security definer set search_path = '' as $$
declare p public.payments%rowtype; j public.payment_issuance_jobs%rowtype;
begin
  select * into p from public.payments where id=target_payment_id for update;
  select * into j from public.payment_issuance_jobs where payment_id=target_payment_id for update;
  if p.id is null or j.state is distinct from 'claimed' or j.token is distinct from claim_token then raise exception 'Claim invalido'; end if;
  if p.external_reference is distinct from reference_value or p.valor_total is distinct from amount_value or p.metodo is distinct from method_value
    or nullif(trim(gateway_id),'') is null then raise exception 'Cobranca divergente'; end if;
  insert into public.payment_attempts(payment_id,gateway_payment_id,status,boleto_url,expires_at)
    values(p.id,gateway_id,'aguardando',boleto_value,p.data_expiracao);
  update public.payment_issuance_jobs set state='issued',updated_at=now() where payment_id=p.id;
  -- Never mark paid here: webhook/reconciliation owns settlement.
end;
$$;

create or replace function public.flag_payment_issuance_reconciliation(target_payment_id uuid, claim_token uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.payment_issuance_jobs set state='reconcile',updated_at=now()
    where payment_id=target_payment_id and token=claim_token and state='claimed';
end;
$$;

revoke all on function public.claim_payment_issuance(uuid,uuid) from public,anon,authenticated;
revoke all on function public.complete_payment_issuance(uuid,uuid,text,text,numeric,public.payment_method,text) from public,anon,authenticated;
revoke all on function public.flag_payment_issuance_reconciliation(uuid,uuid) from public,anon,authenticated;
grant execute on function public.claim_payment_issuance(uuid,uuid) to service_role;
grant execute on function public.complete_payment_issuance(uuid,uuid,text,text,numeric,public.payment_method,text) to service_role;
grant execute on function public.flag_payment_issuance_reconciliation(uuid,uuid) to service_role;
commit;
