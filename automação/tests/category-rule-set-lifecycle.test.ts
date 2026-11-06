import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assertCategoryVersionEditable } from '../../lib/events/category-rule-set-lifecycle';

test('evento sem checagem travada e sem status terminal permite criar/ativar versão de categorias', () => {
  const resolved = assertCategoryVersionEditable({ checagem_travada_em: null, status: 'inscricao' });
  assert.deepEqual(resolved, { ok: true });
});

test('evento com checagem travada bloqueia criar/ativar versão de categorias', () => {
  const resolved = assertCategoryVersionEditable({ checagem_travada_em: '2026-11-06T09:00:00Z', status: 'chaves' });
  assert.equal(resolved.ok, false);
  if (!resolved.ok) assert.match(resolved.message, /checagem.*travada/i);
});

test('evento cancelado bloqueia mesmo sem checagem travada', () => {
  const resolved = assertCategoryVersionEditable({ checagem_travada_em: null, status: 'cancelado' });
  assert.equal(resolved.ok, false);
  if (!resolved.ok) assert.match(resolved.message, /cancelado|concluído/i);
});

test('evento concluído bloqueia', () => {
  const resolved = assertCategoryVersionEditable({ checagem_travada_em: '2026-11-01T00:00:00Z', status: 'concluido' });
  assert.equal(resolved.ok, false);
  if (!resolved.ok) assert.match(resolved.message, /cancelado|concluído/i);
});
