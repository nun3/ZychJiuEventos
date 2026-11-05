import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  deriveCategoryFormStateFromCatalog,
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
  assert.equal(state.genero, 'U')
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
    assert.equal(validPreMirim.value.genero, 'U')
    assert.equal(validPreMirim.value.peso_max_kg, 14.7)
  }
})
