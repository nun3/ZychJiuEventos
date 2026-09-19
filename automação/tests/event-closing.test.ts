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
