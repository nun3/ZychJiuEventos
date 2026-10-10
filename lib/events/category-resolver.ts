import { ageOnDate, beltOrder, categorize, type Category, type Competitor } from '../categorization'

const BELT_LABELS = ['Branca', 'Cinza', 'Amarela', 'Laranja', 'Verde', 'Azul', 'Roxa', 'Marrom', 'Preta'] as const

export type EventCategoryWithCatalog = Category & { catalog_category_id?: string | null }

export type SportCategoryDefinition = {
  id: string
  catalog_id: string
  codigo: string
  nome: string
  divisao_etaria: string
  idade_min: number
  idade_max: number | null
  genero: 'M' | 'F' | 'U'
  faixa_min_ordem: number
  faixa_max_ordem: number
  peso_min_kg: number
  peso_max_kg: number | null
  ordem: number
}

export type SportCategoryCatalog = {
  id: string
  version: number
  modality: 'gi' | 'no_gi'
  categories: SportCategoryDefinition[]
}

export type PublicCategoryInput = {
  birthDate: string
  gender: 'M' | 'F'
  belt: string
  weightKg: number
  eventDate: string
  eventCategories: EventCategoryWithCatalog[]
  catalog?: SportCategoryCatalog | null
}

export type PublicCategoryClassification = {
  source: 'catalog' | 'legacy-event'
  catalogCategoryId: string | null
  catalogVersion: number | null
  modality: 'gi' | 'no_gi' | null
  categoryLabel: string
  ageDivisionLabel: string
  competitiveAge: number
  genderLabel: string
  beltLabel: string
  weightMinKg: number
  weightLimitKg: number | null
  weightInformedKg: number
  marginKg: number | null
}

export type PublicCategoryAvailability = {
  available: boolean
  eventCategoryId: string | null
}

export type PublicCategoryResolution =
  | { status: 'resolved'; classification: PublicCategoryClassification; availability: PublicCategoryAvailability }
  | { status: 'unresolved'; reason: string }

const GENDER_LABEL: Record<'M' | 'F', string> = { M: 'Masculino', F: 'Feminino' }

export function parsePublicWeightKg(raw: string): number | null {
  const normalized = raw.trim().replace(/\s/g, '').replace(',', '.')
  if (!normalized) return null
  const value = Number(normalized)
  if (!Number.isFinite(value) || value <= 0) return null
  return Math.round(value * 100) / 100
}

function isValidIsoCalendarDate(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false
  const [year, month, day] = iso.split('-').map(Number)
  if (year < 1900 || year > 2100) return false
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

export function maskBrBirthDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

export function parseBrBirthDateToIso(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (isValidIsoCalendarDate(trimmed)) return trimmed
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed)
  if (!match) return null
  const iso = `${match[3]}-${match[2]}-${match[1]}`
  return isValidIsoCalendarDate(iso) ? iso : null
}

function canonicalBeltLabel(belt: string) {
  const key = belt.trim().toLowerCase()
  return BELT_LABELS.find((item) => item.toLowerCase() === key) || belt.trim()
}

function roundKg(value: number) {
  return Math.round(value * 100) / 100
}

function classifyFromCatalog(input: PublicCategoryInput, catalog: SportCategoryCatalog): PublicCategoryResolution {
  const competitiveAge = ageOnDate(input.birthDate, input.eventDate)
  const athleteBeltOrder = beltOrder(input.belt)
  if (!athleteBeltOrder) return { status: 'unresolved', reason: 'Faixa não reconhecida.' }

  const matches = catalog.categories
    .filter((category) =>
      competitiveAge >= category.idade_min
      && (category.idade_max == null || competitiveAge <= category.idade_max)
      && (category.genero === 'U' || category.genero === input.gender)
      && athleteBeltOrder >= category.faixa_min_ordem
      && athleteBeltOrder <= category.faixa_max_ordem
      && input.weightKg >= category.peso_min_kg
      && (category.peso_max_kg == null || input.weightKg <= category.peso_max_kg),
    )
    .sort((left, right) => left.ordem - right.ordem)

  if (!matches.length) {
    return { status: 'unresolved', reason: 'Não foi possível identificar sua categoria com os dados informados.' }
  }
  if (matches[1]?.ordem === matches[0].ordem) {
    return { status: 'unresolved', reason: 'Classificação ambígua no catálogo esportivo.' }
  }

  const category = matches[0]
  const mappedEventCategories = input.eventCategories.filter(
    (candidate) => candidate.catalog_category_id === category.id,
  )
  const operationalMatch = categorize({
    data_nascimento: input.birthDate,
    genero: input.gender,
    faixa: input.belt,
    peso_kg: input.weightKg,
  }, input.eventDate, mappedEventCategories)
  const eventCategory = operationalMatch.category
  const weightLimitKg = category.peso_max_kg

  return {
    status: 'resolved',
    classification: {
      source: 'catalog',
      catalogCategoryId: category.id,
      catalogVersion: catalog.version,
      modality: catalog.modality,
      categoryLabel: category.nome,
      ageDivisionLabel: category.divisao_etaria,
      competitiveAge,
      genderLabel: GENDER_LABEL[input.gender],
      beltLabel: canonicalBeltLabel(input.belt),
      weightMinKg: category.peso_min_kg,
      weightLimitKg,
      weightInformedKg: input.weightKg,
      marginKg: weightLimitKg == null ? null : roundKg(weightLimitKg - input.weightKg),
    },
    availability: { available: Boolean(eventCategory), eventCategoryId: eventCategory?.id ?? null },
  }
}

function classifyLegacyEvent(input: PublicCategoryInput): PublicCategoryResolution {
  if (!input.eventCategories.length) {
    return { status: 'unresolved', reason: 'Este campeonato ainda não possui uma tabela estruturada para cálculo automático de categoria.' }
  }
  const competitor: Competitor = {
    data_nascimento: input.birthDate,
    genero: input.gender,
    faixa: input.belt,
    peso_kg: input.weightKg,
  }
  const result = categorize(competitor, input.eventDate, input.eventCategories)
  if (!result.category) {
    return { status: 'unresolved', reason: result.reason || 'Não encontramos uma categoria compatível com os dados informados neste campeonato.' }
  }

  const category = result.category
  const competitiveAge = ageOnDate(input.birthDate, input.eventDate)
  return {
    status: 'resolved',
    classification: {
      source: 'legacy-event',
      catalogCategoryId: null,
      catalogVersion: null,
      modality: null,
      categoryLabel: category.nome,
      ageDivisionLabel: `${category.idade_min}–${category.idade_max} anos`,
      competitiveAge,
      genderLabel: GENDER_LABEL[input.gender],
      beltLabel: canonicalBeltLabel(input.belt),
      weightMinKg: category.peso_min_kg,
      weightLimitKg: category.peso_max_kg,
      weightInformedKg: input.weightKg,
      marginKg: roundKg(category.peso_max_kg - input.weightKg),
    },
    availability: { available: true, eventCategoryId: category.id },
  }
}

export function resolvePublicCategory(input: PublicCategoryInput): PublicCategoryResolution {
  if (!isValidIsoCalendarDate(input.birthDate)) {
    return { status: 'unresolved', reason: 'Informe uma data de nascimento válida (DD/MM/AAAA).' }
  }
  if (!isValidIsoCalendarDate(input.eventDate)) {
    return { status: 'unresolved', reason: 'Data do evento indisponível para o cálculo.' }
  }
  if (!Number.isFinite(input.weightKg) || input.weightKg <= 0) {
    return { status: 'unresolved', reason: 'Informe um peso válido em kg.' }
  }
  return input.catalog ? classifyFromCatalog(input, input.catalog) : classifyLegacyEvent(input)
}
