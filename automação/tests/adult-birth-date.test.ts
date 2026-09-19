import assert from 'node:assert/strict';
import { test } from 'node:test';
import { evaluateAdultBirthDate } from '../../lib/auth/adult-birth-date';

const today = '2026-09-19';

test('nascimento ausente ou inválido é recusado', () => {
  assert.deepEqual(evaluateAdultBirthDate('', today), { ok: false, code: 'missing' });
  assert.deepEqual(evaluateAdultBirthDate('19/09/2000', today), { ok: false, code: 'invalid' });
  assert.deepEqual(evaluateAdultBirthDate('2026-09-20', today), { ok: false, code: 'invalid' });
});

test('menor de 18 anos não cria conta', () => {
  assert.deepEqual(evaluateAdultBirthDate('2008-09-20', today), { ok: false, code: 'minor' });
});

test('18 anos completos na data de hoje é aceito', () => {
  assert.deepEqual(evaluateAdultBirthDate('2008-09-19', today), { ok: true, iso: '2008-09-19' });
  assert.deepEqual(evaluateAdultBirthDate('1990-01-01', today), { ok: true, iso: '1990-01-01' });
});
