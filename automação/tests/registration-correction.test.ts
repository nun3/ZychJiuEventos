import assert from 'node:assert/strict';
import { test } from 'node:test';
import { displayCorrectionValue, isCorrectionField } from '../../lib/registrations/correction';

test('somente os quatro campos do lote sao suportados', () => {
  assert.equal(isCorrectionField('nome'), true);
  assert.equal(isCorrectionField('faixa'), true);
  assert.equal(isCorrectionField('peso'), true);
  assert.equal(isCorrectionField('equipe'), true);
  assert.equal(isCorrectionField('categoria'), false);
  assert.equal(isCorrectionField('genero'), false);
});

test('exibe antes/depois a partir do payload auditavel', () => {
  assert.equal(displayCorrectionValue('nome', { nome_completo: 'Ana Silva' }), 'Ana Silva');
  assert.equal(displayCorrectionValue('faixa', { faixa: 'Azul' }), 'Azul');
  assert.equal(displayCorrectionValue('peso', { peso_kg: 70 }), '70 kg');
  assert.equal(displayCorrectionValue('equipe', { team_id: 'x', team_name: 'Equipe Um' }), 'Equipe Um');
});
