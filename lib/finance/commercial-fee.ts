import { MAX_AMOUNT_CENTS } from '../payments/domain'

/** 1 basis point = 0.01%. 10_000 bps = 100%. */
export const BPS_DENOMINATOR = 10_000

/** Taxa padrão MEU CAMP: 10% do bruto. */
export const DEFAULT_PLATFORM_RATE_BPS = 1_000

/** Promoção inicial: 8% do bruto. */
export const PROMOTIONAL_PLATFORM_RATE_BPS = 800

/** Duração padrão da promoção a partir da primeira inscrição paga. */
export const DEFAULT_PROMOTION_DURATION_MONTHS = 5

export type CommercialFeeKind = 'STANDARD' | 'PROMOTIONAL'

export type RevenuePartner = {
  partnerId: string
  /** Share of platform fee in basis points. All partners must sum to BPS_DENOMINATOR. */
  shareBps: number
}

/** Distribuição societária padrão da receita MEU CAMP (50/50). */
export const DEFAULT_REVENUE_PARTNERS: readonly RevenuePartner[] = [
  { partnerId: 'junior', shareBps: 5_000 },
  { partnerId: 'ricardo', shareBps: 5_000 },
] as const

export type CommercialFeePolicyInput = {
  kind: CommercialFeeKind
  platformRateBps: number
  /** Required when kind is PROMOTIONAL: start of the promotional window. */
  startsAt?: Date
  /** Duration in calendar months from startsAt. Defaults to DEFAULT_PROMOTION_DURATION_MONTHS. */
  durationMonths?: number
}

export type ResolvePlatformRateInput = {
  /** Explicit override (e.g. per-event). When set, policies are ignored. */
  platformRateBps?: number
  policies?: readonly CommercialFeePolicyInput[]
  /** Anchor for promotional windows: first paid registration of the organization. */
  firstPaidAt?: Date | null
  now?: Date
}

export type PartnerAmount = {
  partnerId: string
  shareBps: number
  amountCents: number
}

export type CommercialSplitInput = {
  grossCents: number
  providerFeeCents: number
  platformRateBps: number
  partners?: readonly RevenuePartner[]
}

export type CommercialSplitResult = {
  grossCents: number
  providerFeeCents: number
  platformRateBps: number
  platformFeeCents: number
  partnerAmounts: PartnerAmount[]
  organizerNetCents: number
}

function assertSafeNonNegativeCents(value: number, label: string) {
  if (!Number.isSafeInteger(value) || value < 0 || value > MAX_AMOUNT_CENTS) {
    throw new Error(`${label} inválido.`)
  }
}

function assertRateBps(rateBps: number) {
  if (!Number.isSafeInteger(rateBps) || rateBps < 0 || rateBps > BPS_DENOMINATOR) {
    throw new Error('Taxa da plataforma inválida.')
  }
}

function assertPartners(partners: readonly RevenuePartner[]) {
  if (!partners.length) throw new Error('Distribuição de parceiros obrigatória.')
  let total = 0
  const seen = new Set<string>()
  for (const partner of partners) {
    if (!partner.partnerId.trim()) throw new Error('Parceiro inválido.')
    if (seen.has(partner.partnerId)) throw new Error('Parceiro duplicado.')
    seen.add(partner.partnerId)
    if (!Number.isSafeInteger(partner.shareBps) || partner.shareBps < 0 || partner.shareBps > BPS_DENOMINATOR) {
      throw new Error('Participação de parceiro inválida.')
    }
    total += partner.shareBps
    if (!Number.isSafeInteger(total)) throw new Error('Participação de parceiro inválida.')
  }
  if (total !== BPS_DENOMINATOR) throw new Error('Participações devem somar 100%.')
}

/** Add calendar months without relying on float; clamps day to end of target month. */
export function addCalendarMonths(date: Date, months: number): Date {
  if (!Number.isSafeInteger(months) || months < 0) throw new Error('Duração da promoção inválida.')
  if (Number.isNaN(date.getTime())) throw new Error('Data inválida.')
  const result = new Date(date.getTime())
  const day = result.getUTCDate()
  result.setUTCDate(1)
  result.setUTCMonth(result.getUTCMonth() + months)
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate()
  result.setUTCDate(Math.min(day, lastDay))
  return result
}

/**
 * Taxa MEU CAMP sobre o valor bruto, em centavos.
 * Usa floor: nunca arredonda a favor da plataforma por truncamento implícito de float.
 */
export function calculatePlatformFeeCents(grossCents: number, platformRateBps: number): number {
  assertSafeNonNegativeCents(grossCents, 'Valor bruto')
  if (grossCents <= 0) throw new Error('Valor bruto deve ser positivo.')
  assertRateBps(platformRateBps)
  const fee = Math.floor((grossCents * platformRateBps) / BPS_DENOMINATOR)
  assertSafeNonNegativeCents(fee, 'Taxa da plataforma')
  if (fee > grossCents) throw new Error('Taxa da plataforma excede o bruto.')
  return fee
}

/**
 * Distribui a receita MEU CAMP entre parceiros.
 * Centavos residuais vão para o último parceiro na ordem estável fornecida.
 */
export function distributePlatformRevenue(
  platformFeeCents: number,
  partners: readonly RevenuePartner[] = DEFAULT_REVENUE_PARTNERS,
): PartnerAmount[] {
  assertSafeNonNegativeCents(platformFeeCents, 'Taxa da plataforma')
  assertPartners(partners)

  const amounts: PartnerAmount[] = []
  let allocated = 0
  for (let index = 0; index < partners.length; index += 1) {
    const partner = partners[index]
    const isLast = index === partners.length - 1
    const amountCents = isLast
      ? platformFeeCents - allocated
      : Math.floor((platformFeeCents * partner.shareBps) / BPS_DENOMINATOR)
    if (!Number.isSafeInteger(amountCents) || amountCents < 0) {
      throw new Error('Distribuição de parceiros inválida.')
    }
    allocated += amountCents
    amounts.push({ partnerId: partner.partnerId, shareBps: partner.shareBps, amountCents })
  }
  if (allocated !== platformFeeCents) throw new Error('Distribuição de parceiros não fecha.')
  return amounts
}

/**
 * Resolve a taxa efetiva a aplicar.
 * Precedência: override explícito > promoção ativa > STANDARD > DEFAULT_PLATFORM_RATE_BPS.
 */
export function resolvePlatformRateBps(input: ResolvePlatformRateInput = {}): number {
  if (input.platformRateBps != null) {
    assertRateBps(input.platformRateBps)
    return input.platformRateBps
  }

  const now = input.now ?? new Date()
  if (Number.isNaN(now.getTime())) throw new Error('Data inválida.')

  const policies = input.policies ?? [
    {
      kind: 'PROMOTIONAL',
      platformRateBps: PROMOTIONAL_PLATFORM_RATE_BPS,
      durationMonths: DEFAULT_PROMOTION_DURATION_MONTHS,
    },
    {
      kind: 'STANDARD',
      platformRateBps: DEFAULT_PLATFORM_RATE_BPS,
    },
  ]

  for (const policy of policies) {
    assertRateBps(policy.platformRateBps)
    if (policy.kind === 'STANDARD') continue
    if (policy.kind !== 'PROMOTIONAL') throw new Error('Política comercial inválida.')
    if (!input.firstPaidAt) continue
    if (Number.isNaN(input.firstPaidAt.getTime())) throw new Error('Data inválida.')
    const duration = policy.durationMonths ?? DEFAULT_PROMOTION_DURATION_MONTHS
    const startsAt = policy.startsAt ?? input.firstPaidAt
    if (Number.isNaN(startsAt.getTime())) throw new Error('Data inválida.')
    if (now.getTime() < startsAt.getTime()) continue
    const endsAt = addCalendarMonths(startsAt, duration)
    if (now.getTime() < endsAt.getTime()) return policy.platformRateBps
  }

  const standard = policies.find((policy) => policy.kind === 'STANDARD')
  if (standard) {
    assertRateBps(standard.platformRateBps)
    return standard.platformRateBps
  }
  return DEFAULT_PLATFORM_RATE_BPS
}

/**
 * Calcula taxa MEU CAMP, distribuição societária e líquido do organizador.
 * Identidade: gross = providerFee + organizerNet + sum(partnerAmounts).
 * O custo do PSP é suportado pelo organizador e não reduz Junior/Ricardo.
 */
export function calculateCommercialSplit(input: CommercialSplitInput): CommercialSplitResult {
  assertSafeNonNegativeCents(input.grossCents, 'Valor bruto')
  if (input.grossCents <= 0) throw new Error('Valor bruto deve ser positivo.')
  assertSafeNonNegativeCents(input.providerFeeCents, 'Custo do PSP')
  assertRateBps(input.platformRateBps)

  const partners = input.partners ?? DEFAULT_REVENUE_PARTNERS
  const platformFeeCents = calculatePlatformFeeCents(input.grossCents, input.platformRateBps)
  const partnerAmounts = distributePlatformRevenue(platformFeeCents, partners)
  const partnerTotal = partnerAmounts.reduce((sum, partner) => sum + partner.amountCents, 0)
  if (partnerTotal !== platformFeeCents) throw new Error('Distribuição de parceiros não fecha.')

  const organizerNetCents = input.grossCents - input.providerFeeCents - platformFeeCents
  if (!Number.isSafeInteger(organizerNetCents)) throw new Error('Líquido do organizador inválido.')
  if (organizerNetCents < 0) throw new Error('Custos excedem o valor bruto.')

  const identity =
    input.providerFeeCents + organizerNetCents + partnerTotal
  if (identity !== input.grossCents) throw new Error('Identidade contábil não fecha.')

  return {
    grossCents: input.grossCents,
    providerFeeCents: input.providerFeeCents,
    platformRateBps: input.platformRateBps,
    platformFeeCents,
    partnerAmounts,
    organizerNetCents,
  }
}
