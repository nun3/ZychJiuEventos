import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  DEFAULT_PLATFORM_RATE_BPS,
  DEFAULT_REVENUE_PARTNERS,
  PROMOTIONAL_PLATFORM_RATE_BPS,
  addCalendarMonths,
  calculateCommercialSplit,
  calculatePlatformFeeCents,
  distributePlatformRevenue,
  resolvePlatformRateBps,
} from '../../lib/finance/commercial-fee'

test('taxa padrão 10% sobre R$ 100,00 fecha Junior/Ricardo e líquido com PSP', () => {
  const result = calculateCommercialSplit({
    grossCents: 10_000,
    providerFeeCents: 199,
    platformRateBps: DEFAULT_PLATFORM_RATE_BPS,
  })
  assert.equal(result.platformFeeCents, 1_000)
  assert.deepEqual(result.partnerAmounts, [
    { partnerId: 'junior', shareBps: 5_000, amountCents: 500 },
    { partnerId: 'ricardo', shareBps: 5_000, amountCents: 500 },
  ])
  assert.equal(result.organizerNetCents, 8_801)
  assert.equal(
    result.providerFeeCents + result.organizerNetCents + result.partnerAmounts.reduce((s, p) => s + p.amountCents, 0),
    result.grossCents,
  )
})

test('promoção 8% divide 50/50 da receita MEU CAMP, não 4% fixo independente', () => {
  const result = calculateCommercialSplit({
    grossCents: 10_000,
    providerFeeCents: 199,
    platformRateBps: PROMOTIONAL_PLATFORM_RATE_BPS,
  })
  assert.equal(result.platformFeeCents, 800)
  assert.deepEqual(result.partnerAmounts, [
    { partnerId: 'junior', shareBps: 5_000, amountCents: 400 },
    { partnerId: 'ricardo', shareBps: 5_000, amountCents: 400 },
  ])
  assert.equal(result.organizerNetCents, 9_001)
})

test('centavo residual vai para o último parceiro na ordem estável', () => {
  assert.deepEqual(distributePlatformRevenue(801, DEFAULT_REVENUE_PARTNERS), [
    { partnerId: 'junior', shareBps: 5_000, amountCents: 400 },
    { partnerId: 'ricardo', shareBps: 5_000, amountCents: 401 },
  ])
})

test('calculatePlatformFeeCents usa floor em centavos', () => {
  // 1.99% of 10001 would float; 199 bps of 10001 = floor(1990199/10000) = 199
  assert.equal(calculatePlatformFeeCents(10_001, 199), 199)
  assert.equal(calculatePlatformFeeCents(10_000, 1_000), 1_000)
})

test('identidade contábil sempre fecha para combinações válidas', () => {
  for (const [gross, provider, rate] of [
    [10_000, 0, 1_000],
    [10_000, 199, 800],
    [1, 0, 0],
    [12_345, 50, 1_000],
    [999, 0, 1_000],
  ] as const) {
    const result = calculateCommercialSplit({
      grossCents: gross,
      providerFeeCents: provider,
      platformRateBps: rate,
    })
    const partners = result.partnerAmounts.reduce((sum, partner) => sum + partner.amountCents, 0)
    assert.equal(partners, result.platformFeeCents)
    assert.equal(result.providerFeeCents + result.organizerNetCents + partners, result.grossCents)
  }
})

test('promoção ativa enquanto now < firstPaidAt + 5 meses', () => {
  const firstPaidAt = new Date('2026-01-15T12:00:00.000Z')
  assert.equal(
    resolvePlatformRateBps({ firstPaidAt, now: new Date('2026-03-01T00:00:00.000Z') }),
    PROMOTIONAL_PLATFORM_RATE_BPS,
  )
  assert.equal(
    resolvePlatformRateBps({ firstPaidAt, now: new Date('2026-06-14T23:59:59.000Z') }),
    PROMOTIONAL_PLATFORM_RATE_BPS,
  )
})

test('fora da janela promocional usa taxa STANDARD', () => {
  const firstPaidAt = new Date('2026-01-15T12:00:00.000Z')
  assert.equal(
    resolvePlatformRateBps({ firstPaidAt, now: new Date('2026-06-15T12:00:00.000Z') }),
    DEFAULT_PLATFORM_RATE_BPS,
  )
  assert.equal(
    resolvePlatformRateBps({ firstPaidAt: null, now: new Date('2026-03-01T00:00:00.000Z') }),
    DEFAULT_PLATFORM_RATE_BPS,
  )
})

test('override explícito tem precedência sobre promoção', () => {
  assert.equal(
    resolvePlatformRateBps({
      platformRateBps: 500,
      firstPaidAt: new Date('2026-01-15T12:00:00.000Z'),
      now: new Date('2026-03-01T00:00:00.000Z'),
    }),
    500,
  )
})

test('addCalendarMonths preserva dia e clampa fim de mês', () => {
  assert.equal(addCalendarMonths(new Date('2026-01-31T12:00:00.000Z'), 1).toISOString(), '2026-02-28T12:00:00.000Z')
  assert.equal(addCalendarMonths(new Date('2026-01-15T12:00:00.000Z'), 5).toISOString(), '2026-06-15T12:00:00.000Z')
})

test('rejeita inputs inválidos', () => {
  assert.throws(() => calculatePlatformFeeCents(0, 1_000), /positivo/)
  assert.throws(() => calculatePlatformFeeCents(100, -1), /Taxa/)
  assert.throws(() => calculatePlatformFeeCents(100, 10_001), /Taxa/)
  assert.throws(
    () => distributePlatformRevenue(100, [{ partnerId: 'a', shareBps: 4_000 }, { partnerId: 'b', shareBps: 4_000 }]),
    /100%/,
  )
  assert.throws(
    () => calculateCommercialSplit({ grossCents: 100, providerFeeCents: 200, platformRateBps: 0 }),
    /excedem/,
  )
  assert.throws(() => resolvePlatformRateBps({ platformRateBps: -1 }), /Taxa/)
})
