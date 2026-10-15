import 'server-only'
import { createClient } from '../supabase/server'
import {
  getOrganizationFinancialReadiness,
  isOrganizationPaymentProvider,
  mapOrganizationPaymentAccountRow,
  type FinancialReadiness,
  type OrganizationPaymentAccount,
  type OrganizationPaymentAccountStatus,
  type OrganizationPaymentProvider,
} from './organization-payment-account'

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function getOrganizationPaymentAccount(
  organizationId: string,
  provider: OrganizationPaymentProvider = 'asaas',
): Promise<OrganizationPaymentAccount | null> {
  if (!uuid.test(organizationId)) throw new Error('Organização inválida.')
  if (!isOrganizationPaymentProvider(provider)) throw new Error('Provedor financeiro inválido.')

  const supabase = createClient()
  const { data, error } = await supabase
    .from('organization_payment_accounts')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('provider', provider)
    .maybeSingle()

  if (error) throw new Error('Não foi possível consultar a configuração financeira.')
  if (!data) return null
  return mapOrganizationPaymentAccountRow(data)
}

export async function createOrganizationPaymentAccountPending(
  organizationId: string,
  provider: OrganizationPaymentProvider = 'asaas',
): Promise<OrganizationPaymentAccount> {
  if (!uuid.test(organizationId)) throw new Error('Organização inválida.')
  if (!isOrganizationPaymentProvider(provider)) throw new Error('Provedor financeiro inválido.')

  const supabase = createClient()
  const { data, error } = await supabase.rpc('create_organization_payment_account_pending', {
    target_organization_id: organizationId,
    provider_value: provider,
  })

  if (error || !data || typeof data !== 'object' || Array.isArray(data) || data.kind !== 'organization_payment_account') {
    throw new Error(error?.message || 'Não foi possível iniciar a configuração financeira.')
  }

  const account = await getOrganizationPaymentAccount(organizationId, provider)
  if (!account) throw new Error('Configuração financeira criada, mas não pôde ser relida.')
  return account
}

export async function getOrganizationFinancialReadinessForOrg(
  organizationId: string,
  provider: OrganizationPaymentProvider = 'asaas',
): Promise<FinancialReadiness> {
  const account = await getOrganizationPaymentAccount(organizationId, provider)
  return getOrganizationFinancialReadiness(account)
}

export async function adminUpdateOrganizationPaymentAccount(input: {
  accountId: string
  status?: OrganizationPaymentAccountStatus
  providerAccountId?: string | null
  walletId?: string | null
  kycStatus?: string | null
  payoutStatus?: string | null
}): Promise<{
  id: string
  organizationId: string
  provider: string
  status: string
}> {
  if (!uuid.test(input.accountId)) throw new Error('Conta financeira inválida.')
  if (input.status === 'ready') throw new Error('READY bloqueado até onboarding BaaS.')

  const supabase = createClient()
  const { data, error } = await supabase.rpc('admin_update_organization_payment_account', {
    target_account_id: input.accountId,
    next_status: input.status ?? null,
    next_provider_account_id: input.providerAccountId ?? null,
    next_wallet_id: input.walletId ?? null,
    next_kyc_status: input.kycStatus ?? null,
    next_payout_status: input.payoutStatus ?? null,
  })

  if (error || !data || typeof data !== 'object' || Array.isArray(data) || data.kind !== 'organization_payment_account') {
    throw new Error(error?.message || 'Atualização financeira recusada.')
  }

  return {
    id: String(data.id),
    organizationId: String(data.organizationId),
    provider: String(data.provider),
    status: String(data.status),
  }
}
