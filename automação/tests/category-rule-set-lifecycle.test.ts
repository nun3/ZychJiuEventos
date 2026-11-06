import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assertCategoryVersionEditable } from '../../lib/events/category-rule-set-lifecycle';

test('evento sem checagem travada permite criar/ativar versão de categorias', () => {
  const resolved = assertCategoryVersionEditable({ checagem_travada_em: null });
  assert.deepEqual(resolved, { ok: true });
});

test('evento com checagem travada bloqueia criar/ativar versão de categorias', () => {
  const resolved = assertCategoryVersionEditable({ checagem_travada_em: '2026-11-06T09:00:00Z' });
  assert.equal(resolved.ok, false);
  if (!resolved.ok) assert.match(resolved.message, /checagem.*travada/i);
});
