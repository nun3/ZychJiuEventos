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

function isValidIsoCalendarDate(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false
  const [year, month, day] = iso.split('-').map(Number)
  if (year < 1900 || year > 2100) return false
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

/** Máscara digitável pt-BR: DD/MM/AAAA (evita o bug do input type=date com ano 00xx). */
export function maskBrBirthDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

/** Aceita DD/MM/AAAA ou ISO YYYY-MM-DD. */
export function parseBrBirthDateToIso(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (isValidIsoCalendarDate(trimmed)) return trimmed
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed)
  if (!match) return null
  const iso = `${match[3]}-${match[2]}-${match[1]}`
  return isValidIsoCalendarDate(iso) ? iso : null
}

export function resolvePublicCategory(input: PublicCategoryInput): PublicCategoryResolution {
  if (!isValidIsoCalendarDate(input.birthDate)) {
    return { ok: false, reason: 'Informe uma data de nascimento válida (DD/MM/AAAA).' }
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
