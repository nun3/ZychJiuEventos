import assert from 'node:assert/strict';
import test from 'node:test';
import {
  finishLock,
  idleLockForm,
  lockButtonLabel,
  startLock,
} from '../../lib/checking/lock-form-state';

test('botão de lock começa habilitado com o rótulo de ação', () => {
  assert.equal(idleLockForm.pending, false);
  assert.equal(idleLockForm.locked, false);
  assert.equal(lockButtonLabel(idleLockForm), 'Travar checagem');
});

test('clique mostra Travando e a conclusão libera o pending', () => {
  const pending = startLock(idleLockForm);
  assert.equal(pending.pending, true);
  assert.equal(lockButtonLabel(pending), 'Travando…');

  const locked = finishLock({
    ok: true,
    message: 'Checagem travada. A lista oficial não aceita novas alterações.',
  });
  assert.equal(locked.pending, false);
  assert.equal(locked.locked, true);
  assert.equal(locked.message?.ok, true);
  assert.equal(lockButtonLabel(locked), 'Travar checagem');
});

test('erro real libera o pending e preserva o formulário', () => {
  const failed = finishLock({ ok: false, message: 'Não foi possível travar a checagem.' });
  assert.equal(failed.pending, false);
  assert.equal(failed.locked, false);
  assert.equal(failed.message?.ok, false);
  assert.equal(lockButtonLabel(failed), 'Travar checagem');
  assert.equal(startLock(failed).pending, true);
});
