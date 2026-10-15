import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  getOrganizationFinancialReadiness,
  isFinanciallyReady,
  isOrganizationPaymentAccountStatus,
  isOrganizationPaymentProvider,
  mapOrganizationPaymentAccountRow,
  type OrganizationPaymentAccount,
} from '../../lib/finance/organization-payment-account'

function account(
  overrides: Partial<OrganizationPaymentAccount> = {},
): OrganizationPaymentAccount {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    organizationId: '22222222-2222-2222-2222-222222222222',
    provider: 'asaas',
    providerAccountId: null,
    walletId: null,
    status: 'not_started',
    kycStatus: null,
    payoutStatus: null,
    createdBy: null,
    createdAt: '2026-10-10T00:00:00.000Z',
    updatedAt: '2026-10-10T00:00:00.000Z',
    ...overrides,
  }
}

test('readiness sem conta e com conta nunca libera ready neste lote', () => {
  assert.deepEqual(getOrganizationFinancialReadiness(null), {
    ready: false,
    reason: 'NO_ACCOUNT',
  })
  assert.equal(isFinanciallyReady(null), false)

  const pending = account({ status: 'not_started' })
  assert.deepEqual(getOrganizationFinancialReadiness(pending), {
    ready: false,
    reason: 'ACCOUNT_PENDING',
  })
  assert.equal(isFinanciallyReady(pending), false)

  const approved = account({
    status: 'approved',
    providerAccountId: 'acc',
    walletId: 'wallet',
  })
  assert.deepEqual(getOrganizationFinancialReadiness(approved), {
    ready: false,
    reason: 'ACCOUNT_PENDING',
  })
  assert.equal(isFinanciallyReady(approved), false)

  // Mesmo se o enum ready existir no banco no futuro, o domínio deste lote não libera.
  const readyRow = account({ status: 'ready', providerAccountId: 'acc', walletId: 'w' })
  assert.equal(getOrganizationFinancialReadiness(readyRow).ready, false)
  assert.equal(isFinanciallyReady(readyRow), false)
  assert.notEqual(getOrganizationFinancialReadiness(readyRow).reason, 'READY')
})

test('readiness distingue restricted, kyc e payout pendente', () => {
  assert.deepEqual(getOrganizationFinancialReadiness(account({ status: 'restricted' })), {
    ready: false,
    reason: 'RESTRICTED',
  })
  assert.deepEqual(getOrganizationFinancialReadiness(account({ status: 'identity_pending' })), {
    ready: false,
    reason: 'KYC_PENDING',
  })
  assert.deepEqual(getOrganizationFinancialReadiness(account({ status: 'under_review' })), {
    ready: false,
    reason: 'KYC_PENDING',
  })
  assert.deepEqual(getOrganizationFinancialReadiness(account({ status: 'payout_pending' })), {
    ready: false,
    reason: 'PAYOUT_PENDING',
  })
})

test('mapeia row SQL e rejeita provider/status invalidos', () => {
  const mapped = mapOrganizationPaymentAccountRow({
    id: '11111111-1111-1111-1111-111111111111',
    organization_id: '22222222-2222-2222-2222-222222222222',
    provider: 'asaas',
    provider_account_id: null,
    wallet_id: null,
    status: 'not_started',
    kyc_status: null,
    payout_status: null,
    created_by: null,
    created_at: '2026-10-10T00:00:00.000Z',
    updated_at: '2026-10-10T00:00:00.000Z',
  })
  assert.equal(mapped.provider, 'asaas')
  assert.equal(mapped.status, 'not_started')
  assert.throws(
    () => mapOrganizationPaymentAccountRow({
      id: '11111111-1111-1111-1111-111111111111',
      organization_id: '22222222-2222-2222-2222-222222222222',
      provider: 'stripe',
      provider_account_id: null,
      wallet_id: null,
      status: 'not_started',
      kyc_status: null,
      payout_status: null,
      created_by: null,
      created_at: '2026-10-10T00:00:00.000Z',
      updated_at: '2026-10-10T00:00:00.000Z',
    }),
    /Provedor/,
  )
  assert.equal(isOrganizationPaymentProvider('asaas'), true)
  assert.equal(isOrganizationPaymentProvider('live'), false)
  assert.equal(isOrganizationPaymentAccountStatus('ready'), true)
  assert.equal(isOrganizationPaymentAccountStatus('READY'), false)
})
