import type { Json } from '@/lib/supabase/database.types'

export const REGISTRATION_CORRECTION_FIELDS = ['nome', 'faixa', 'peso', 'equipe'] as const
export type RegistrationCorrectionField = (typeof REGISTRATION_CORRECTION_FIELDS)[number]

export const CORRECTION_FIELD_LABELS: Record<RegistrationCorrectionField, string> = {
  nome: 'Nome',
  faixa: 'Faixa',
  peso: 'Peso',
  equipe: 'Equipe',
}

export const RECOGNIZED_BELTS = [
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

export const CORRECTION_STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  aprovada: 'Aprovada',
  recusada: 'Rejeitada',
}

export type CorrectionValue = {
  nome_completo?: string
  faixa?: string
  peso_kg?: number
  team_id?: string
  team_name?: string
}

export function isCorrectionField(value: string): value is RegistrationCorrectionField {
  return (REGISTRATION_CORRECTION_FIELDS as readonly string[]).includes(value)
}

export function snapshotRecord(snapshot: Json) {
  return snapshot && typeof snapshot === 'object' && !Array.isArray(snapshot)
    ? snapshot as Record<string, Json | undefined>
    : {}
}

export function correctionValueRecord(value: Json): CorrectionValue {
  const record = snapshotRecord(value)
  const peso = record.peso_kg
  return {
    nome_completo: typeof record.nome_completo === 'string' ? record.nome_completo : undefined,
    faixa: typeof record.faixa === 'string' ? record.faixa : undefined,
    peso_kg: typeof peso === 'number' ? peso : typeof peso === 'string' && peso.trim() ? Number(peso) : undefined,
    team_id: typeof record.team_id === 'string' ? record.team_id : undefined,
    team_name: typeof record.team_name === 'string' ? record.team_name : undefined,
  }
}

export function displayCorrectionValue(field: RegistrationCorrectionField, value: Json) {
  const parsed = correctionValueRecord(value)
  if (field === 'nome') return parsed.nome_completo || 'Não informado'
  if (field === 'faixa') return parsed.faixa || 'Não informado'
  if (field === 'peso') {
    return parsed.peso_kg != null && Number.isFinite(parsed.peso_kg)
      ? `${parsed.peso_kg.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg`
      : 'Não informado'
  }
  return parsed.team_name || 'Não informado'
}
