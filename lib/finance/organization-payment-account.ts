export const ORGANIZATION_PAYMENT_PROVIDERS = ['asaas'] as const
export type OrganizationPaymentProvider = (typeof ORGANIZATION_PAYMENT_PROVIDERS)[number]

export const ORGANIZATION_PAYMENT_ACCOUNT_STATUSES = [
  'not_started',
  'account_created',
  'identity_pending',
  'under_review',
  'approved',
  'payout_pending',
  'ready',
  'restricted',
] as const
export type OrganizationPaymentAccountStatus =
  (typeof ORGANIZATION_PAYMENT_ACCOUNT_STATUSES)[number]

export type FinancialReadinessReason =
  | 'NO_ACCOUNT'
  | 'ACCOUNT_PENDING'
  | 'KYC_PENDING'
  | 'PAYOUT_PENDING'
  | 'RESTRICTED'
  | 'READY'

export type FinancialReadiness = {
  ready: boolean
  reason: FinancialReadinessReason
}

export type OrganizationPaymentAccount = {
  id: string
  organizationId: string
  provider: OrganizationPaymentProvider
  providerAccountId: string | null
  walletId: string | null
  status: OrganizationPaymentAccountStatus
  kycStatus: string | null
  payoutStatus: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export function isOrganizationPaymentProvider(value: string): value is OrganizationPaymentProvider {
  return (ORGANIZATION_PAYMENT_PROVIDERS as readonly string[]).includes(value)
}

export function isOrganizationPaymentAccountStatus(
  value: string,
): value is OrganizationPaymentAccountStatus {
  return (ORGANIZATION_PAYMENT_ACCOUNT_STATUSES as readonly string[]).includes(value)
}

/**
 * Neste lote BaaS ainda não existe: nenhuma conta fica financeiramente pronta.
 * READY no enum existe para o futuro; o domínio não libera PIX automático.
 */
export function isFinanciallyReady(
  _account: OrganizationPaymentAccount | null | undefined,
): boolean {
  return false
}

export function getOrganizationFinancialReadiness(
  account: OrganizationPaymentAccount | null | undefined,
): FinancialReadiness {
  if (!account) return { ready: false, reason: 'NO_ACCOUNT' }

  if (account.status === 'restricted') {
    return { ready: false, reason: 'RESTRICTED' }
  }

  if (account.status === 'identity_pending' || account.status === 'under_review') {
    return { ready: false, reason: 'KYC_PENDING' }
  }

  if (account.status === 'payout_pending') {
    return { ready: false, reason: 'PAYOUT_PENDING' }
  }

  // not_started, account_created, approved, ready (ainda sem BaaS) → pendente
  return { ready: false, reason: 'ACCOUNT_PENDING' }
}

export function mapOrganizationPaymentAccountRow(row: {
  id: string
  organization_id: string
  provider: string
  provider_account_id: string | null
  wallet_id: string | null
  status: string
  kyc_status: string | null
  payout_status: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}): OrganizationPaymentAccount {
  if (!isOrganizationPaymentProvider(row.provider)) {
    throw new Error('Provedor financeiro inválido.')
  }
  if (!isOrganizationPaymentAccountStatus(row.status)) {
    throw new Error('Status financeiro inválido.')
  }
  return {
    id: row.id,
    organizationId: row.organization_id,
    provider: row.provider,
    providerAccountId: row.provider_account_id,
    walletId: row.wallet_id,
    status: row.status,
    kycStatus: row.kyc_status,
    payoutStatus: row.payout_status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
