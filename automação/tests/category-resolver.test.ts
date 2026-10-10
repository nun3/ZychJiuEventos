import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Category } from '../../lib/categorization'
import {
  parsePublicWeightKg,
  resolvePublicCategory,
} from '../../lib/events/category-resolver'

const adultMale: Category = {
  id: 'medio',
  nome: 'Adulto Masculino Médio',
  ativa: true,
  ordem: 1,
  genero: 'M',
  idade_min: 18,
  idade_max: 29,
  faixa_min_ordem: 6,
  faixa_max_ordem: 9,
  peso_min_kg: 76.01,
  peso_max_kg: 82,
}

const adultMaleLeve: Category = {
  ...adultMale,
  id: 'leve',
  nome: 'Adulto Masculino Leve',
  ordem: 2,
  peso_min_kg: 70.01,
  peso_max_kg: 76,
}

test('parsePublicWeightKg aceita vírgula e ponto', () => {
  assert.equal(parsePublicWeightKg('81,5'), 81.5)
  assert.equal(parsePublicWeightKg('81.5'), 81.5)
  assert.equal(parsePublicWeightKg(' 0 '), null)
  assert.equal(parsePublicWeightKg('abc'), null)
})

test('resolve categoria pelo rule set do evento (81 kg → Médio)', () => {
  const result = resolvePublicCategory({
    birthDate: '2000-05-10',
    gender: 'M',
    belt: 'Azul',
    weightKg: 81,
    eventDate: '2026-10-10',
    categories: [adultMaleLeve, adultMale],
  })
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.match.categoryId, 'medio')
  assert.equal(result.match.categoryLabel, 'Adulto Masculino Médio')
  assert.equal(result.match.competitiveAge, 26)
  assert.equal(result.match.weightLimitKg, 82)
  assert.equal(result.match.marginKg, 1)
})

test('sem categorias estruturadas retorna mensagem operacional', () => {
  const result = resolvePublicCategory({
    birthDate: '2000-05-10',
    gender: 'M',
    belt: 'Azul',
    weightKg: 81,
    eventDate: '2026-10-10',
    categories: [],
  })
  assert.equal(result.ok, false)
  if (result.ok) return
  assert.match(result.reason, /tabela estruturada/)
})

test('fora dos limites não inventa categoria', () => {
  const result = resolvePublicCategory({
    birthDate: '2000-05-10',
    gender: 'M',
    belt: 'Azul',
    weightKg: 90,
    eventDate: '2026-10-10',
    categories: [adultMaleLeve, adultMale],
  })
  assert.equal(result.ok, false)
  if (result.ok) return
  assert.match(result.reason, /Nenhuma categoria elegível|Não encontramos/)
})

test('ignora categoria inativa', () => {
  const result = resolvePublicCategory({
    birthDate: '2000-05-10',
    gender: 'M',
    belt: 'Azul',
    weightKg: 81,
    eventDate: '2026-10-10',
    categories: [{ ...adultMale, ativa: false }],
  })
  assert.equal(result.ok, false)
})
