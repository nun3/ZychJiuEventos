import assert from 'node:assert/strict'
import { test } from 'node:test'
import { NO_DATE_KEY, groupByMonth, monthLabel } from '../../lib/home/catalog-groups'

test('agrupa por mês preservando a ordem de entrada', () => {
  const groups = groupByMonth([
    { id: 'a', dateObj: '2026-11-12' },
    { id: 'b', dateObj: '2026-11-28' },
    { id: 'c', dateObj: '2026-12-02' },
    { id: 'd', dateObj: '2027-01-10' },
  ])
  assert.deepEqual(groups.map((g) => g.key), ['2026-11', '2026-12', '2027-01'])
  assert.deepEqual(groups[0].events.map((e) => e.id), ['a', 'b'])
})

test('eventos sem data vão para um grupo próprio', () => {
  const groups = groupByMonth([{ id: 'a', dateObj: '2026-11-12' }, { id: 'b' }, { id: 'c', dateObj: 'invalida' }])
  assert.deepEqual(groups.map((g) => g.key), ['2026-11', NO_DATE_KEY])
  assert.equal(groups[1].events.length, 2)
})

test('lista vazia não gera grupos', () => {
  assert.deepEqual(groupByMonth([]), [])
})

test('rótulo do mês em português, sem depender do fuso', () => {
  assert.equal(monthLabel('2026-11'), 'novembro de 2026')
  assert.equal(monthLabel('2027-01'), 'janeiro de 2027')
  assert.equal(monthLabel(NO_DATE_KEY), 'Data a definir')
})
