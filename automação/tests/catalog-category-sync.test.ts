import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  buildCategoryVersionRows,
  categoryActivationCompensation,
  categoryInsertCompensation,
  definitionNeedsOverride,
  deriveCategoryFormStateFromCatalog,
  expandCatalogSelectionToCategoryRows,
  formatCatalogCategoryDefaultName,
  validateCategoryInputAgainstCatalog,
  type CatalogCategoryDefinition,
} from '../../lib/events/catalog-category-sync'

const preMirimGalo: CatalogCategoryDefinition = {
  id: 'ca7a1001-0000-4000-8000-000000000001',
  codigo: 'pre_mirim_galo',
  nome: 'Galo',
  divisao_etaria: 'PRÉ-MIRIM',
  idade_min: 4,
  idade_max: 5,
  genero: 'U',
  faixa_min_ordem: 1,
  faixa_max_ordem: 9,
  peso_min_kg: 0,
  peso_max_kg: 14.7,
  ordem: 1,
}

const adultoMasculinoLeve: CatalogCategoryDefinition = {
  id: 'ca7a1001-0000-4000-8000-000000000085',
  codigo: 'adulto_master_m_leve',
  nome: 'Leve',
  divisao_etaria: 'ADULTO/MASTER',
  idade_min: 18,
  idade_max: null,
  genero: 'M',
  faixa_min_ordem: 1,
  faixa_max_ordem: 9,
  peso_min_kg: 70.1,
  peso_max_kg: 76,
  ordem: 85,
}

const adultoPesadissimo: CatalogCategoryDefinition = {
  id: 'ca7a1001-0000-4000-8000-000000000090',
  codigo: 'adulto_master_m_pesadissimo',
  nome: 'Pesadissimo',
  divisao_etaria: 'ADULTO/MASTER',
  idade_min: 18,
  idade_max: null,
  genero: 'M',
  faixa_min_ordem: 1,
  faixa_max_ordem: 9,
  peso_min_kg: 100.6,
  peso_max_kg: null,
  ordem: 90,
}

test('sincroniza categoria infantil unissex (U) com limites exatos do catálogo', () => {
  const state = deriveCategoryFormStateFromCatalog(preMirimGalo)
  assert.equal(state.catalogCategoryId, preMirimGalo.id)
  assert.equal(state.categoryName, 'PRÉ-MIRIM Galo')
  assert.equal(state.genero, '')
  assert.equal(state.idadeMin, '4')
  assert.equal(state.idadeMax, '5')
  assert.equal(state.faixaMin, '1')
  assert.equal(state.faixaMax, '9')
  assert.equal(state.pesoMin, '0')
  assert.equal(state.pesoMax, '14.7')
})

test('não inventa valores para campos ausentes no catálogo (idade_max nula ou peso_max_kg nulo)', () => {
  const leveState = deriveCategoryFormStateFromCatalog(adultoMasculinoLeve)
  assert.equal(leveState.categoryName, 'ADULTO/MASTER Masculino Leve')
  assert.equal(leveState.genero, 'M')
  assert.equal(leveState.idadeMin, '18')
  assert.equal(leveState.idadeMax, '')
  assert.equal(leveState.pesoMin, '70.1')
  assert.equal(leveState.pesoMax, '76')

  const pesadissimoState = deriveCategoryFormStateFromCatalog(adultoPesadissimo)
  assert.equal(pesadissimoState.idadeMax, '')
  assert.equal(pesadissimoState.pesoMin, '100.6')
  assert.equal(pesadissimoState.pesoMax, '')
})

test('preserva nome customizado digitado pelo organizador ao vincular categoria teórica', () => {
  const autoFirst = formatCatalogCategoryDefaultName(preMirimGalo)
  const switched = deriveCategoryFormStateFromCatalog(adultoMasculinoLeve, autoFirst, autoFirst)
  assert.equal(switched.categoryName, 'ADULTO/MASTER Masculino Leve')

  const customKept = deriveCategoryFormStateFromCatalog(adultoMasculinoLeve, 'Adulto Masculino Leve', '')
  assert.equal(customKept.categoryName, 'Adulto Masculino Leve')
})

test('impede salvamento de combinações inconsistentes ou com limites em branco', () => {
  const missingMaxAge = validateCategoryInputAgainstCatalog(
    {
      categoryName: 'ADULTO/MASTER Masculino Leve',
      genero: 'M',
      idadeMinRaw: '18',
      idadeMaxRaw: '',
      faixaMinRaw: '1',
      faixaMaxRaw: '9',
      pesoMinRaw: '70.1',
      pesoMaxRaw: '76',
    },
    adultoMasculinoLeve,
  )
  assert.equal(missingMaxAge.ok, false)

  const mismatchedPreMirim = validateCategoryInputAgainstCatalog(
    {
      categoryName: 'PRÉ-MIRIM Galo',
      genero: 'M',
      idadeMinRaw: '18',
      idadeMaxRaw: '29',
      faixaMinRaw: '1',
      faixaMaxRaw: '1',
      pesoMinRaw: '0',
      pesoMaxRaw: '76',
    },
    preMirimGalo,
  )
  assert.equal(mismatchedPreMirim.ok, false)

  const mismatchedWeight = validateCategoryInputAgainstCatalog(
    {
      categoryName: 'PRÉ-MIRIM Galo',
      genero: 'U',
      idadeMinRaw: '4',
      idadeMaxRaw: '5',
      faixaMinRaw: '1',
      faixaMaxRaw: '9',
      pesoMinRaw: '0',
      pesoMaxRaw: '76',
    },
    preMirimGalo,
  )
  assert.equal(mismatchedWeight.ok, false)

  const validPreMirim = validateCategoryInputAgainstCatalog(
    {
      categoryName: 'PRÉ-MIRIM Galo',
      genero: 'U',
      idadeMinRaw: '4',
      idadeMaxRaw: '5',
      faixaMinRaw: '1',
      faixaMaxRaw: '9',
      pesoMinRaw: '0',
      pesoMaxRaw: '14.7',
    },
    preMirimGalo,
  )
  assert.equal(validPreMirim.ok, true)
  if (validPreMirim.ok) {
    assert.deepEqual(validPreMirim.values.map((value) => value.genero), ['M', 'F'])
    assert.deepEqual(validPreMirim.values.map((value) => value.nome), ['PRÉ-MIRIM Galo Masculino', 'PRÉ-MIRIM Galo Feminino'])
    assert.equal(validPreMirim.values[0].peso_max_kg, 14.7)
    assert.equal(validPreMirim.values[1].peso_max_kg, 14.7)
    assert.equal(validPreMirim.values[0].idade_min, 4)
    assert.equal(validPreMirim.values[1].idade_max, 5)
    assert.notEqual(validPreMirim.values[0].nome, validPreMirim.values[1].nome)
  }

  const rejectedMixed = validateCategoryInputAgainstCatalog(
    {
      categoryName: 'Categoria avulsa',
      genero: 'U',
      idadeMinRaw: '18',
      idadeMaxRaw: '29',
      faixaMinRaw: '1',
      faixaMaxRaw: '1',
      pesoMinRaw: '0',
      pesoMaxRaw: '76',
    },
    null,
  )
  assert.equal(rejectedMixed.ok, false)
})

const femininoLeve: CatalogCategoryDefinition = {
  ...adultoMasculinoLeve,
  id: 'ca7a1001-0000-4000-8000-000000000099',
  genero: 'F',
  nome: 'Leve',
  divisao_etaria: 'ADULTO/MASTER',
}

function limitsOf(input: {
  categoryName: string
  genero: string
  idadeMinRaw: string
  idadeMaxRaw: string
  faixaMinRaw: string
  faixaMaxRaw: string
  pesoMinRaw: string
  pesoMaxRaw: string
}, definition: CatalogCategoryDefinition | null) {
  return validateCategoryInputAgainstCatalog(input, definition)
}

test('definição M cria só a masculina e definição F cria só a feminina', () => {
  const masculine = limitsOf({
    categoryName: 'ADULTO/MASTER Masculino Leve',
    genero: 'M',
    idadeMinRaw: '18',
    idadeMaxRaw: '40',
    faixaMinRaw: '1',
    faixaMaxRaw: '9',
    pesoMinRaw: '70.1',
    pesoMaxRaw: '76',
  }, adultoMasculinoLeve)
  assert.equal(masculine.ok, true)
  if (masculine.ok) assert.deepEqual(masculine.values.map((value) => value.genero), ['M'])

  const feminine = limitsOf({
    categoryName: 'ADULTO/MASTER Feminino Leve',
    genero: 'F',
    idadeMinRaw: '18',
    idadeMaxRaw: '40',
    faixaMinRaw: '1',
    faixaMaxRaw: '9',
    pesoMinRaw: '70.1',
    pesoMaxRaw: '76',
  }, femininoLeve)
  assert.equal(feminine.ok, true)
  if (feminine.ok) assert.deepEqual(feminine.values.map((value) => value.genero), ['F'])
})

test('o lote de U é uma inserção só, com os dois sexos e o mesmo catalog_category_id', () => {
  const materialized = limitsOf({
    categoryName: 'PRÉ-MIRIM Galo',
    genero: '',
    idadeMinRaw: '4',
    idadeMaxRaw: '5',
    faixaMinRaw: '1',
    faixaMaxRaw: '9',
    pesoMinRaw: '0',
    pesoMaxRaw: '14.7',
  }, preMirimGalo)
  assert.equal(materialized.ok, true)
  if (!materialized.ok) return
  const rows = buildCategoryVersionRows(materialized.values, preMirimGalo.id, 3)
  assert.equal(rows.length, 2)
  assert.deepEqual(rows.map((row) => row.genero), ['M', 'F'])
  assert.equal(rows[0].catalog_category_id, preMirimGalo.id)
  assert.equal(rows[1].catalog_category_id, rows[0].catalog_category_id)
  assert.equal(rows[0].peso_max_kg, rows[1].peso_max_kg)
  assert.equal(rows[0].idade_min, rows[1].idade_min)
  assert.equal(rows[0].faixa_max_ordem, rows[1].faixa_max_ordem)
  assert.equal(rows[0].fight_duration_minutes, 3)
  assert.equal(rows[1].fight_duration_minutes, 3)
  assert.notEqual(rows[0].nome, rows[1].nome)
})

test('falha do insert compensa a versão vazia; se o delete falha, a versão pode permanecer', () => {
  assert.deepEqual(categoryInsertCompensation(false), {
    compensated: true,
    message: 'Não foi possível cadastrar as categorias.',
  })
  assert.equal(categoryInsertCompensation(true).compensated, false)
})

test('falha de ativação compensa a versão criada; mensagem não convida a reenviar quando o estado do evento mudou', () => {
  const generic = categoryActivationCompensation(false, false)
  assert.equal(generic.compensated, true)
  assert.match(generic.message, /tentar novamente/)

  const genericDeleteFailed = categoryActivationCompensation(true, false)
  assert.equal(genericDeleteFailed.compensated, false)

  const racedWithEventState = categoryActivationCompensation(false, true)
  assert.equal(racedWithEventState.compensated, true)
  assert.doesNotMatch(racedWithEventState.message, /tentar novamente/)

  assert.equal(categoryActivationCompensation(true, true).compensated, false)
})

test('retry depois de falha recomeça o lote inteiro, sem completar um sexo só', () => {
  const again = limitsOf({
    categoryName: 'PRÉ-MIRIM Galo',
    genero: '',
    idadeMinRaw: '4',
    idadeMaxRaw: '5',
    faixaMinRaw: '1',
    faixaMaxRaw: '9',
    pesoMinRaw: '0',
    pesoMaxRaw: '14.7',
  }, preMirimGalo)
  assert.equal(again.ok, true)
  if (!again.ok) return
  const retry = buildCategoryVersionRows(again.values, preMirimGalo.id, null)
  assert.deepEqual(retry.map((row) => row.genero), ['M', 'F'])
})

// --- Seleção múltipla do catálogo (G2, lote 5 — montagem da tabela) ---

const preMirimPluma: CatalogCategoryDefinition = {
  ...preMirimGalo,
  id: 'ca7a1001-0000-4000-8000-000000000002',
  codigo: 'pre_mirim_pluma',
  nome: 'Pluma',
  peso_min_kg: 14.8,
  peso_max_kg: 17.9,
  ordem: 2,
}

test('definitionNeedsOverride só exige teto quando o catálogo não fixa idade_max ou peso_max_kg', () => {
  assert.deepEqual(definitionNeedsOverride(preMirimGalo), { idade: false, peso: false })
  assert.deepEqual(definitionNeedsOverride(adultoMasculinoLeve), { idade: true, peso: false })
  assert.deepEqual(definitionNeedsOverride(adultoPesadissimo), { idade: true, peso: true })
})

test('seleção vazia é rejeitada sem gerar uma versão sem categoria', () => {
  const result = expandCatalogSelectionToCategoryRows([], {}, null)
  assert.equal(result.ok, false)
  if (!result.ok) assert.match(result.message, /selecione ao menos uma categoria/i)
})

test('seleção parcial de duas definições compartilhadas gera 4 categorias efetivas, com o ordem do catálogo (não 1 fixo)', () => {
  const result = expandCatalogSelectionToCategoryRows([preMirimGalo, preMirimPluma], {}, 5)
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.rows.length, 4)
  assert.deepEqual(result.rows.map((row) => row.genero), ['M', 'F', 'M', 'F'])
  assert.deepEqual(result.rows.map((row) => row.ordem), [1, 1, 2, 2])
  assert.equal(result.rows[0].catalog_category_id, preMirimGalo.id)
  assert.equal(result.rows[1].catalog_category_id, preMirimGalo.id)
  assert.equal(result.rows[2].catalog_category_id, preMirimPluma.id)
  assert.equal(result.rows[3].catalog_category_id, preMirimPluma.id)
  assert.ok(result.rows.every((row) => row.fight_duration_minutes === 5))
  assert.equal(new Set(result.rows.map((row) => row.nome)).size, 4)
})

test('definições M e F da mesma divisão não se misturam automaticamente, cada uma mantém seu gênero', () => {
  const result = expandCatalogSelectionToCategoryRows([adultoMasculinoLeve, femininoLeve], { [adultoMasculinoLeve.id]: { idadeMax: '40' }, [femininoLeve.id]: { idadeMax: '40' } }, null)
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.rows.length, 2)
  assert.deepEqual(result.rows.map((row) => row.genero).sort(), ['F', 'M'])
  assert.notEqual(result.rows[0].catalog_category_id, result.rows[1].catalog_category_id)
})

test('"selecionar todas" com divisão sem teto exige idade máxima e peso máximo informados', () => {
  const missingBoth = expandCatalogSelectionToCategoryRows([adultoMasculinoLeve, adultoPesadissimo], {}, null)
  assert.equal(missingBoth.ok, false)
  if (!missingBoth.ok) assert.match(missingBoth.message, /idade máxima/i)

  const missingWeight = expandCatalogSelectionToCategoryRows(
    [adultoMasculinoLeve, adultoPesadissimo],
    { [adultoMasculinoLeve.id]: { idadeMax: '45' }, [adultoPesadissimo.id]: { idadeMax: '45' } },
    null,
  )
  assert.equal(missingWeight.ok, false)
  if (!missingWeight.ok) assert.match(missingWeight.message, /peso máximo/i)

  const complete = expandCatalogSelectionToCategoryRows(
    [adultoMasculinoLeve, adultoPesadissimo],
    { [adultoMasculinoLeve.id]: { idadeMax: '45' }, [adultoPesadissimo.id]: { idadeMax: '45', pesoMax: '150' } },
    null,
  )
  assert.equal(complete.ok, true)
  if (!complete.ok) return
  assert.equal(complete.rows.find((row) => row.catalog_category_id === adultoMasculinoLeve.id)?.idade_max, 45)
  assert.equal(complete.rows.find((row) => row.catalog_category_id === adultoPesadissimo.id)?.peso_max_kg, 150)
})

test('teto informado abaixo do mínimo do catálogo é recusado, sem inventar um valor', () => {
  const belowAge = expandCatalogSelectionToCategoryRows([adultoMasculinoLeve], { [adultoMasculinoLeve.id]: { idadeMax: '10' } }, null)
  assert.equal(belowAge.ok, false)

  const belowWeight = expandCatalogSelectionToCategoryRows([adultoPesadissimo], { [adultoPesadissimo.id]: { idadeMax: '40', pesoMax: '50' } }, null)
  assert.equal(belowWeight.ok, false)
})

test('duas definições que gerariam o mesmo nome efetivo são recusadas antes do insert', () => {
  const clash: CatalogCategoryDefinition = { ...preMirimGalo, id: 'ca7a1001-0000-4000-8000-000000000003' }
  const result = expandCatalogSelectionToCategoryRows([preMirimGalo, clash], {}, null)
  assert.equal(result.ok, false)
  if (!result.ok) assert.match(result.message, /mesmo nome/i)
})
