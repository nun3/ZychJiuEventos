import assert from 'node:assert/strict'
import { test } from 'node:test'
import { maskBrBirthDateInput, parseBrBirthDateToIso, parsePublicWeightKg, resolvePublicCategory, type EventCategoryWithCatalog, type SportCategoryCatalog, type SportCategoryDefinition } from '../../lib/events/category-resolver'

const catalogId = 'ca7a1000-0000-4000-8000-000000000001'
function definition(id: string, nome: string, min: number, max: number | null, ordem: number): SportCategoryDefinition {
  return { id, catalog_id: catalogId, codigo: `adulto_master_m_${nome.toLowerCase().replace('-', '_')}`, nome, divisao_etaria: 'ADULTO/MASTER', idade_min: 18, idade_max: null, genero: 'M', faixa_min_ordem: 1, faixa_max_ordem: 9, peso_min_kg: min, peso_max_kg: max, ordem }
}
const leve = definition('00000000-0000-4000-8000-000000000001', 'Leve', 70.1, 76, 4)
const medio = definition('00000000-0000-4000-8000-000000000002', 'Médio', 76.1, 82.3, 5)
const pesado = definition('00000000-0000-4000-8000-000000000003', 'Pesado', 88.4, 94.3, 7)
const pesadissimo = definition('00000000-0000-4000-8000-000000000004', 'Pesadissimo', 100.6, null, 9)
const catalog: SportCategoryCatalog = { id: catalogId, version: 1, modality: 'gi', categories: [leve, medio, pesado, pesadissimo] }

function offered(def: SportCategoryDefinition): EventCategoryWithCatalog {
  return { id: `event-${def.id}`, nome: def.nome, ativa: true, ordem: def.ordem, genero: 'M', idade_min: 18, idade_max: 99, faixa_min_ordem: 1, faixa_max_ordem: 9, peso_min_kg: def.peso_min_kg, peso_max_kg: def.peso_max_kg ?? 300, catalog_category_id: def.id }
}
function resolve(weightKg: number, eventCategories: EventCategoryWithCatalog[] = [offered(leve), offered(medio)]) {
  return resolvePublicCategory({ birthDate: '2000-05-10', gender: 'M', belt: 'Azul', weightKg, eventDate: '2026-10-10', eventCategories, catalog })
}

test('parsePublicWeightKg aceita vírgula e ponto', () => {
  assert.equal(parsePublicWeightKg('81,5'), 81.5)
  assert.equal(parsePublicWeightKg('81.5'), 81.5)
  assert.equal(parsePublicWeightKg(' 0 '), null)
  assert.equal(parsePublicWeightKg('abc'), null)
})

test('máscara e parse de nascimento em DD/MM/AAAA', () => {
  assert.equal(maskBrBirthDateInput('20101990'), '20/10/1990')
  assert.equal(parseBrBirthDateToIso('20/10/1990'), '1990-10-20')
  assert.equal(parseBrBirthDateToIso('20/10/0019'), null)
  assert.equal(parseBrBirthDateToIso('31/02/1990'), null)
})

test('75 kg classifica como Leve e encontra disponibilidade explícita', () => {
  const result = resolve(75)
  assert.equal(result.status, 'resolved')
  if (result.status !== 'resolved') return
  assert.equal(result.classification.categoryLabel, 'Leve')
  assert.equal(result.availability.available, true)
  assert.equal(result.availability.eventCategoryId, `event-${leve.id}`)
})

test('81 kg classifica como Médio e encontra disponibilidade explícita', () => {
  const result = resolve(81)
  assert.equal(result.status, 'resolved')
  if (result.status !== 'resolved') return
  assert.equal(result.classification.categoryLabel, 'Médio')
  assert.equal(result.classification.catalogVersion, 1)
  assert.equal(result.classification.marginKg, 1.3)
  assert.equal(result.availability.available, true)
})

test('92 kg descobre Pesado mesmo indisponível no evento', () => {
  const result = resolve(92)
  assert.equal(result.status, 'resolved')
  if (result.status !== 'resolved') return
  assert.equal(result.classification.categoryLabel, 'Pesado')
  assert.equal(result.classification.catalogCategoryId, pesado.id)
  assert.equal(result.availability.available, false)
  assert.equal(result.availability.eventCategoryId, null)
})

test('categoria sem limite máximo usa peso_max_kg nulo', () => {
  const result = resolve(120, [offered(pesadissimo)])
  assert.equal(result.status, 'resolved')
  if (result.status !== 'resolved') return
  assert.equal(result.classification.categoryLabel, 'Pesadissimo')
  assert.equal(result.classification.weightLimitKg, null)
  assert.equal(result.classification.marginKg, null)
})

test('vínculo explícito não ignora limites operacionais da inscrição', () => {
  const result = resolve(81, [{ ...offered(medio), peso_max_kg: 80 }])
  assert.equal(result.status, 'resolved')
  if (result.status !== 'resolved') return
  assert.equal(result.classification.categoryLabel, 'Médio')
  assert.equal(result.availability.available, false)
})

test('evento legado continua usando apenas categorias do próprio rule set', () => {
  const legacy: EventCategoryWithCatalog = { ...offered(medio), catalog_category_id: null }
  const result = resolvePublicCategory({ birthDate: '2000-05-10', gender: 'M', belt: 'Azul', weightKg: 81, eventDate: '2026-10-10', eventCategories: [legacy], catalog: null })
  assert.equal(result.status, 'resolved')
  if (result.status !== 'resolved') return
  assert.equal(result.classification.source, 'legacy-event')
  assert.equal(result.availability.available, true)
})

test('sem catálogo e sem categorias retorna estado não resolvido', () => {
  const result = resolvePublicCategory({ birthDate: '2000-05-10', gender: 'M', belt: 'Azul', weightKg: 81, eventDate: '2026-10-10', eventCategories: [], catalog: null })
  assert.equal(result.status, 'unresolved')
  if (result.status === 'unresolved') assert.match(result.reason, /tabela estruturada/)
})

test('faixa inválida e idade sem divisão não inventam classificação', () => {
  const invalidBelt = resolvePublicCategory({ birthDate: '2000-05-10', gender: 'M', belt: 'Coral', weightKg: 75, eventDate: '2026-10-10', eventCategories: [], catalog })
  assert.deepEqual(invalidBelt, { status: 'unresolved', reason: 'Faixa não reconhecida.' })

  const childWithoutDivision = resolvePublicCategory({ birthDate: '2024-05-10', gender: 'M', belt: 'Branca', weightKg: 15, eventDate: '2026-10-10', eventCategories: [], catalog })
  assert.equal(childWithoutDivision.status, 'unresolved')
})
