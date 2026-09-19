import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildEventClosing,
  composesGrossRevenue,
  formatClosingAmount,
  isPerformedRegistration,
} from '../../lib/finance/event-closing';
import type { ClosingRegistrationInput } from '../../lib/finance/event-closing';

function row(partial: Partial<ClosingRegistrationInput> & Pick<ClosingRegistrationInput, 'id' | 'status'>): ClosingRegistrationInput {
  return {
    athleteName: `Atleta ${partial.id}`,
    categoryName: 'Adulto',
    paymentStatus: null,
    paymentAmount: null,
    settlementOrigin: null,
    platformFeeCents: null,
    ...partial,
  };
}

test('rascunho não conta como inscrição realizada', () => {
  assert.equal(isPerformedRegistration('rascunho'), false);
  assert.equal(isPerformedRegistration('pendente_pagamento'), true);
  const report = buildEventClosing([
    row({ id: 'draft', status: 'rascunho' }),
    row({ id: 'pending', status: 'pendente_pagamento' }),
  ]);
  assert.equal(report.totals.performedCount, 1);
  assert.equal(report.lines.length, 1);
});

test('pendente não entra na receita bruta', () => {
  const pending = row({
    id: 'pending',
    status: 'pendente_pagamento',
    paymentStatus: 'aguardando',
    paymentAmount: '80.00',
  });
  assert.equal(composesGrossRevenue(pending), false);
  const report = buildEventClosing([pending]);
  assert.equal(report.totals.grossRevenue, '0.00');
  assert.equal(report.lines[0].consideredCents, 0);
});

test('baixa manual efetivada entra na receita pelo valor do pagamento', () => {
  const settled = row({
    id: 'settled',
    status: 'efetivada',
    paymentStatus: 'pago',
    paymentAmount: '80.00',
    settlementOrigin: 'baixa_manual',
  });
  assert.equal(composesGrossRevenue(settled), true);
  const report = buildEventClosing([settled]);
  assert.equal(report.totals.settledCount, 1);
  assert.equal(report.totals.grossRevenue, '80.00');
  assert.equal(formatClosingAmount(report.totals.grossRevenueCents), 'R$ 80,00');
});

test('cancelamento conta no total sem entrar na receita', () => {
  const report = buildEventClosing([
    row({ id: 'cancelled', status: 'cancelada', paymentAmount: '80.00' }),
    row({
      id: 'settled',
      status: 'efetivada',
      paymentStatus: 'pago',
      paymentAmount: '80.00',
      settlementOrigin: 'baixa_manual',
    }),
  ]);
  assert.equal(report.totals.performedCount, 2);
  assert.equal(report.totals.cancelledCount, 1);
  assert.equal(report.totals.grossRevenue, '80.00');
});

test('estorno deixa de compor receita', () => {
  const refunded = row({
    id: 'refunded',
    status: 'estornada',
    paymentStatus: 'estornado',
    paymentAmount: '80.00',
    settlementOrigin: 'pagamento_confirmado',
  });
  assert.equal(composesGrossRevenue(refunded), false);
  const report = buildEventClosing([refunded]);
  assert.equal(report.totals.settledCount, 0);
  assert.equal(report.totals.grossRevenue, '0.00');
});

test('totais sintéticos batem com a soma analítica em centavos', () => {
  const report = buildEventClosing([
    row({ id: 'pending', status: 'pendente_pagamento', paymentStatus: 'aguardando', paymentAmount: '80.00' }),
    row({ id: 'settled', status: 'efetivada', paymentStatus: 'pago', paymentAmount: '80.00', settlementOrigin: 'baixa_manual' }),
    row({ id: 'confirmed', status: 'efetivada', paymentStatus: 'pago', paymentAmount: '40.50', settlementOrigin: 'pagamento_confirmado' }),
    row({ id: 'cancelled', status: 'cancelada' }),
    row({ id: 'refunded', status: 'estornada', paymentStatus: 'estornado', paymentAmount: '80.00' }),
  ]);
  const lineSum = report.lines.reduce((sum, line) => sum + line.consideredCents, 0);
  assert.equal(report.totals.performedCount, 5);
  assert.equal(report.totals.cancelledCount, 1);
  assert.equal(report.totals.settledCount, 2);
  assert.equal(report.totals.grossRevenueCents, lineSum);
  assert.equal(report.totals.grossRevenue, '120.50');
});

test('evento sem taxa contratada mantém líquido igual ao bruto', () => {
  const report = buildEventClosing([
    row({ id: 'settled', status: 'efetivada', paymentStatus: 'pago', paymentAmount: '80.00', settlementOrigin: 'baixa_manual' }),
  ]);
  assert.equal(report.totals.platformFee, '0.00');
  assert.equal(report.totals.netRevenue, report.totals.grossRevenue);
  assert.equal(report.lines[0].appliedFeeAmount, '0.00');
  assert.equal(report.lines[0].netAmount, '80.00');
});

test('taxa aplicada vem do snapshot, não da configuração atual do evento', () => {
  const report = buildEventClosing([
    row({ id: 'old', status: 'efetivada', paymentStatus: 'pago', paymentAmount: '80.00', settlementOrigin: 'baixa_manual', platformFeeCents: 500 }),
    row({ id: 'new', status: 'efetivada', paymentStatus: 'pago', paymentAmount: '80.00', settlementOrigin: 'pagamento_confirmado', platformFeeCents: 900 }),
  ], { configuredFeeCents: 1500 });
  assert.equal(report.configuredFeeCents, 1500);
  assert.equal(report.totals.platformFee, '14.00');
  assert.equal(report.lines[0].appliedFeeAmount, '5.00');
  assert.equal(report.lines[1].appliedFeeAmount, '9.00');
});

test('pendente, cancelada e estornada não geram taxa mesmo com snapshot gravado', () => {
  const report = buildEventClosing([
    row({ id: 'pending', status: 'pendente_pagamento', paymentStatus: 'aguardando', paymentAmount: '80.00', platformFeeCents: 500 }),
    row({ id: 'cancelled', status: 'cancelada', paymentAmount: '80.00', platformFeeCents: 500 }),
    row({ id: 'refunded', status: 'estornada', paymentStatus: 'estornado', paymentAmount: '80.00', platformFeeCents: 500 }),
    row({ id: 'settled', status: 'efetivada', paymentStatus: 'pago', paymentAmount: '80.00', settlementOrigin: 'baixa_manual', platformFeeCents: 500 }),
  ], { configuredFeeCents: 500 });
  assert.equal(report.totals.platformFeeCents, 500);
  assert.equal(report.lines.filter((line) => line.appliedFeeCents > 0).length, 1);
});

test('bruto menos taxa é igual ao líquido e bate com a visão analítica', () => {
  const report = buildEventClosing([
    row({ id: 'settled', status: 'efetivada', paymentStatus: 'pago', paymentAmount: '80.00', settlementOrigin: 'baixa_manual', platformFeeCents: 500 }),
    row({ id: 'confirmed', status: 'efetivada', paymentStatus: 'pago', paymentAmount: '40.50', settlementOrigin: 'pagamento_confirmado', platformFeeCents: 900 }),
    row({ id: 'pending', status: 'pendente_pagamento', paymentStatus: 'aguardando', paymentAmount: '80.00' }),
  ], { configuredFeeCents: 900 });
  const feeSum = report.lines.reduce((sum, line) => sum + line.appliedFeeCents, 0);
  const netSum = report.lines.reduce((sum, line) => sum + line.netCents, 0);
  assert.equal(report.totals.grossRevenue, '120.50');
  assert.equal(report.totals.platformFeeCents, feeSum);
  assert.equal(report.totals.platformFee, '14.00');
  assert.equal(report.totals.netRevenueCents, report.totals.grossRevenueCents - report.totals.platformFeeCents);
  assert.equal(report.totals.netRevenueCents, netSum);
  assert.equal(report.totals.netRevenue, '106.50');
  assert.equal(formatClosingAmount(report.totals.netRevenueCents), 'R$ 106,50');
});
