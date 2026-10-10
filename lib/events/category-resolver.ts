import { ageOnDate, categorize, type Category, type Competitor } from '../categorization'

const BELT_LABELS = [
  'Branca',
  'Cinza',
  'Amarela',
  'Laranja',
  'Verde',
  'Azul',
  'Roxa',
  'Marrom',
  'Preta',
] as const

export type PublicCategoryInput = {
  birthDate: string
  gender: 'M' | 'F'
  belt: string
  weightKg: number
  eventDate: string
  categories: Category[]
}

export type PublicCategoryMatch = {
  categoryId: string
  categoryLabel: string
  competitiveAge: number
  genderLabel: string
  beltLabel: string
  ageRangeLabel: string
  weightMinKg: number
  weightLimitKg: number
  weightInformedKg: number
  marginKg: number
}

export type PublicCategoryResolution =
  | { ok: true; match: PublicCategoryMatch }
  | { ok: false; reason: string }

const GENDER_LABEL: Record<'M' | 'F', string> = {
  M: 'Masculino',
  F: 'Feminino',
}

export function parsePublicWeightKg(raw: string): number | null {
  const normalized = raw.trim().replace(/\s/g, '').replace(',', '.')
  if (!normalized) return null
  const value = Number(normalized)
  if (!Number.isFinite(value) || value <= 0) return null
  return Math.round(value * 100) / 100
}

export function resolvePublicCategory(input: PublicCategoryInput): PublicCategoryResolution {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.birthDate)) {
    return { ok: false, reason: 'Informe a data de nascimento.' }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.eventDate)) {
    return { ok: false, reason: 'Data do evento indisponível para o cálculo.' }
  }
  if (!input.categories.length) {
    return {
      ok: false,
      reason: 'Este campeonato ainda não possui uma tabela estruturada para cálculo automático de categoria.',
    }
  }
  if (!Number.isFinite(input.weightKg) || input.weightKg <= 0) {
    return { ok: false, reason: 'Informe um peso válido em kg.' }
  }

  const competitor: Competitor = {
    data_nascimento: input.birthDate,
    genero: input.gender,
    faixa: input.belt,
    peso_kg: input.weightKg,
  }
  const result = categorize(competitor, input.eventDate, input.categories)
  if (!result.category) {
    return {
      ok: false,
      reason: result.reason || 'Não encontramos uma categoria compatível com os dados informados neste campeonato.',
    }
  }

  const category = result.category
  const competitiveAge = ageOnDate(input.birthDate, input.eventDate)
  const beltKey = input.belt.trim().toLowerCase()
  const beltCanonical = BELT_LABELS.find((belt) => belt.toLowerCase() === beltKey) || input.belt.trim()

  return {
    ok: true,
    match: {
      categoryId: category.id,
      categoryLabel: category.nome,
      competitiveAge,
      genderLabel: GENDER_LABEL[input.gender],
      beltLabel: beltCanonical,
      ageRangeLabel: `${category.idade_min}–${category.idade_max} anos`,
      weightMinKg: category.peso_min_kg,
      weightLimitKg: category.peso_max_kg,
      weightInformedKg: input.weightKg,
      marginKg: Math.round((category.peso_max_kg - input.weightKg) * 100) / 100,
    },
  }
}
