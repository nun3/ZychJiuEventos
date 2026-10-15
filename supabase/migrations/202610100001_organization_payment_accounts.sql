-- Lote 2 financeiro: identidade/configuracao financeira por organizacao.
-- Sem BaaS, sem Asaas HTTP, sem dados bancarios. Mutacao apenas via RPC.
begin;

do $$
begin
  create type public.organization_payment_account_status as enum (
    'not_started',
    'account_created',
    'identity_pending',
    'under_review',
    'approved',
    'payout_pending',
    'ready',
    'restricted'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.organization_payment_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null check (provider = 'asaas'),
  provider_account_id text,
  wallet_id text,
  status public.organization_payment_account_status not null default 'not_started',
  kyc_status text,
  payout_status text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, provider)
);

comment on table public.organization_payment_accounts is
  'Identidade/configuracao financeira por organizacao e provedor. Nao representa saldo, ledger, conta bancaria nem payout. Externos e READY so via caminho controlado (BaaS futuro).';

comment on column public.organization_payment_accounts.provider_account_id is
  'Identificador externo futuro do provedor. Nulo neste lote.';

comment on column public.organization_payment_accounts.wallet_id is
  'Identificador externo futuro de wallet. Nulo neste lote; cliente nao forja.';

comment on column public.organization_payment_accounts.status is
  'Estado da configuracao. Criacao grava not_started. READY bloqueado ate BaaS real.';

alter table public.organization_payment_accounts enable row level security;

drop policy if exists organization_payment_accounts_staff_select
  on public.organization_payment_accounts;
create policy organization_payment_accounts_staff_select
  on public.organization_payment_accounts
  for select
  using (
    public.is_platform_admin()
    or public.has_organization_role(
      organization_id,
      array['owner', 'organizer', 'finance']::public.organization_role[]
    )
  );

revoke all on public.organization_payment_accounts from anon, authenticated;
grant select on public.organization_payment_accounts to authenticated;

create or replace function public.create_organization_payment_account_pending(
  target_organization_id uuid,
  provider_value text default 'asaas'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  actor uuid := auth.uid();
  org public.organizations%rowtype;
  account public.organization_payment_accounts%rowtype;
  normalized_provider text := lower(trim(coalesce(provider_value, '')));
begin
  if actor is null then raise exception 'Sessao obrigatoria'; end if;
  if target_organization_id is null then raise exception 'Organizacao obrigatoria'; end if;
  if normalized_provider is distinct from 'asaas' then
    raise exception 'Provedor financeiro invalido';
  end if;

  if not public.is_platform_admin()
     and not public.has_organization_role(
       target_organization_id,
       array['owner', 'organizer']::public.organization_role[]
     ) then
    raise exception 'Sem permissao para iniciar configuracao financeira';
  end if;

  select * into org from public.organizations where id = target_organization_id for share;
  if not found then raise exception 'Organizacao inexistente'; end if;

  begin
    insert into public.organization_payment_accounts (
      organization_id,
      provider,
      provider_account_id,
      wallet_id,
      status,
      kyc_status,
      payout_status,
      created_by
    ) values (
      org.id,
      normalized_provider,
      null,
      null,
      'not_started',
      null,
      null,
      actor
    )
    returning * into account;
  exception
    when unique_violation then
      raise exception 'Configuracao financeira ja existe para este provedor';
  end;

  insert into public.event_audit_logs (
    organization_id, event_id, actor_id, action, resource_type,
    resource_id, before_data, after_data
  ) values (
    org.id, null, actor,
    'organization_payment_account_created', 'organization_payment_account', account.id,
    null,
    jsonb_build_object(
      'organizationId', account.organization_id,
      'provider', account.provider,
      'status', account.status
    )
  );

  return jsonb_build_object(
    'kind', 'organization_payment_account',
    'id', account.id,
    'organizationId', account.organization_id,
    'provider', account.provider,
    'status', account.status
  );
end;
$fn$;

revoke all on function public.create_organization_payment_account_pending(uuid, text)
  from public, anon;
grant execute on function public.create_organization_payment_account_pending(uuid, text)
  to authenticated;

create or replace function public.admin_update_organization_payment_account(
  target_account_id uuid,
  next_status public.organization_payment_account_status default null,
  next_provider_account_id text default null,
  next_wallet_id text default null,
  next_kyc_status text default null,
  next_payout_status text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  actor uuid := auth.uid();
  account public.organization_payment_accounts%rowtype;
  before_payload jsonb;
begin
  if actor is null then raise exception 'Sessao obrigatoria'; end if;
  if target_account_id is null then raise exception 'Conta financeira obrigatoria'; end if;
  if not public.is_platform_admin() then
    raise exception 'Somente a plataforma atualiza configuracao financeira sensivel';
  end if;

  if next_status = 'ready' then
    raise exception 'READY bloqueado ate onboarding BaaS';
  end if;

  select * into account
    from public.organization_payment_accounts
   where id = target_account_id
   for update;
  if not found then raise exception 'Conta financeira inexistente'; end if;

  before_payload := jsonb_build_object(
    'status', account.status,
    'providerAccountId', account.provider_account_id,
    'walletId', account.wallet_id,
    'kycStatus', account.kyc_status,
    'payoutStatus', account.payout_status
  );

  update public.organization_payment_accounts
     set status = coalesce(next_status, status),
         provider_account_id = case
           when next_provider_account_id is null then provider_account_id
           when trim(next_provider_account_id) = '' then null
           else trim(next_provider_account_id)
         end,
         wallet_id = case
           when next_wallet_id is null then wallet_id
           when trim(next_wallet_id) = '' then null
           else trim(next_wallet_id)
         end,
         kyc_status = case
           when next_kyc_status is null then kyc_status
           when trim(next_kyc_status) = '' then null
           else trim(next_kyc_status)
         end,
         payout_status = case
           when next_payout_status is null then payout_status
           when trim(next_payout_status) = '' then null
           else trim(next_payout_status)
         end,
         updated_at = now()
   where id = account.id
   returning * into account;

  insert into public.event_audit_logs (
    organization_id, event_id, actor_id, action, resource_type,
    resource_id, before_data, after_data
  ) values (
    account.organization_id, null, actor,
    'organization_payment_account_updated', 'organization_payment_account', account.id,
    before_payload,
    jsonb_build_object(
      'status', account.status,
      'providerAccountId', account.provider_account_id,
      'walletId', account.wallet_id,
      'kycStatus', account.kyc_status,
      'payoutStatus', account.payout_status
    )
  );

  return jsonb_build_object(
    'kind', 'organization_payment_account',
    'id', account.id,
    'organizationId', account.organization_id,
    'provider', account.provider,
    'status', account.status,
    'providerAccountId', account.provider_account_id,
    'walletId', account.wallet_id,
    'kycStatus', account.kyc_status,
    'payoutStatus', account.payout_status
  );
end;
$fn$;

revoke all on function public.admin_update_organization_payment_account(
  uuid,
  public.organization_payment_account_status,
  text,
  text,
  text,
  text
) from public, anon;
grant execute on function public.admin_update_organization_payment_account(
  uuid,
  public.organization_payment_account_status,
  text,
  text,
  text,
  text
) to authenticated;

commit;
