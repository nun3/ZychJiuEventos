import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  beginCorrectionSubmit,
  correctionSubmitLabel,
  failCorrectionSubmit,
  finishCorrectionSubmit,
} from '../../lib/registrations/correction-submit-state';

test('envio começa pendente e limpa o feedback anterior', () => {
  assert.equal(beginCorrectionSubmit(true), null);
  assert.deepEqual(beginCorrectionSubmit(false), { pending: true, message: null });
  assert.equal(correctionSubmitLabel(false), 'Enviar solicitação');
  assert.equal(correctionSubmitLabel(true), 'Enviando…');
});

test('resposta libera o pending e preserva sucesso ou erro', () => {
  assert.deepEqual(finishCorrectionSubmit({ ok: true, message: 'Solicitação enviada. Aguarde a decisão da organização.' }), {
    pending: false,
    message: { ok: true, text: 'Solicitação enviada. Aguarde a decisão da organização.' },
  });
  assert.deepEqual(finishCorrectionSubmit({ ok: false, message: 'Não foi possível enviar a solicitação.' }), {
    pending: false,
    message: { ok: false, text: 'Não foi possível enviar a solicitação.' },
  });
});

test('falha de comunicação libera o pending com feedback', () => {
  const failed = failCorrectionSubmit();
  assert.equal(failed.pending, false);
  assert.equal(failed.message?.ok, false);
  assert.match(failed.message?.text || '', /Não foi possível enviar/);
});
