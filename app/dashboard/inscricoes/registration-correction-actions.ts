'use server'

import { revalidatePath } from 'next/cache'
import { allowsPublicOrganization } from '@/lib/events/public-organization'
import {
  CORRECTION_FIELD_LABELS,
  CORRECTION_STATUS_LABELS,
  displayCorrectionValue,
  isCorrectionField,
  type RegistrationCorrectionField,
} from '@/lib/registrations/correction'
import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/supabase/database.types'

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type CorrectionRequestItem = {
  id: string
  field: RegistrationCorrectionField
  fieldLabel: string
  previousLabel: string
  requestedLabel: string
  status: string
  statusLabel: string
  reason: string | null
  createdAt: string
  categoryCompatible: boolean | null
}

export type TeamOption = { id: string; nome: string }

function mapRequest(row: {
  id: string
  requested_field: string
  previous_value: Json
  requested_value: Json
  status: string
  reason: string | null
  created_at: string
  category_compatible: boolean | null
}): CorrectionRequestItem | null {
  if (!isCorrectionField(row.requested_field)) return null
  return {
    id: row.id,
    field: row.requested_field,
    fieldLabel: CORRECTION_FIELD_LABELS[row.requested_field],
    previousLabel: displayCorrectionValue(row.requested_field, row.previous_value),
    requestedLabel: displayCorrectionValue(row.requested_field, row.requested_value),
    status: row.status,
    statusLabel: CORRECTION_STATUS_LABELS[row.status] || row.status,
    reason: row.reason,
    createdAt: row.created_at,
    categoryCompatible: row.category_compatible,
  }
}

async function scopedRegistration(registrationId: string) {
  if (!uuid.test(registrationId)) return null
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: registration } = await supabase
    .from('registrations')
    .select('id, events(organization_id)')
    .eq('id', registrationId)
    .maybeSingle()
  const organizationId = (registration?.events as { organization_id?: string } | null)?.organization_id
  if (!organizationId || !allowsPublicOrganization(organizationId)) return null
  return { supabase, user }
}

export async function listRegistrationCorrections(registrationId: string): Promise<CorrectionRequestItem[]> {
  const scoped = await scopedRegistration(registrationId)
  if (!scoped) return []
  const { data, error } = await scoped.supabase
    .from('registration_correction_requests')
    .select('id, requested_field, previous_value, requested_value, status, reason, created_at, category_compatible')
    .eq('registration_id', registrationId)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data.map(mapRequest).filter((item): item is CorrectionRequestItem => Boolean(item))
}

export async function requestRegistrationCorrection(formData: FormData): Promise<{ ok: boolean; message: string }> {
  const registrationId = String(formData.get('registration_id') || '')
  const field = String(formData.get('requested_field') || '')
  const requestedText = String(formData.get('requested_text') || '').trim()
  const reason = String(formData.get('reason') || '').trim()
  if (!uuid.test(registrationId) || !isCorrectionField(field) || !requestedText) {
    return { ok: false, message: 'Selecione um campo suportado e informe o valor solicitado.' }
  }
  const scoped = await scopedRegistration(registrationId)
  if (!scoped) return { ok: false, message: 'Esta inscrição não pertence à organização ativa.' }
  const { data, error } = await scoped.supabase.rpc('request_registration_correction', {
    target_registration_id: registrationId,
    requested_field: field,
    requested_text: requestedText,
    reason_text: reason || undefined,
  })
  if (error || !data || typeof data !== 'object' || Array.isArray(data) || data.kind !== 'requested') {
    const messages: Record<string, string> = {
      'Sem permissao para solicitar correcao': 'Você não pode solicitar correção desta inscrição.',
      'Checagem travada': 'A checagem está travada. Novas solicitações não são aceitas.',
      'Evento fora da fase de checagem': 'A solicitação só é permitida na fase de checagem.',
      'Inscricao nao efetivada': 'Somente inscrições efetivadas entram na checagem.',
      'Ja existe solicitacao pendente deste campo': 'Já existe uma solicitação pendente deste campo.',
      'Valor solicitado igual ao atual': 'O valor solicitado é igual ao atual da inscrição.',
      'Nome invalido': 'Informe um nome com ao menos 3 caracteres.',
      'Faixa do atleta nao reconhecida': 'Informe uma faixa reconhecida, como Branca ou Azul.',
      'Peso invalido': 'Informe um peso válido em quilogramas.',
      'Equipe invalida': 'Selecione uma equipe válida.',
      'Equipe inexistente': 'A equipe escolhida não existe.',
      'Equipe deve pertencer a mesma organizacao do atleta': 'A equipe precisa pertencer à mesma organização do atleta.',
      'Campo nao suportado': 'Este campo não entra neste lote de correção.',
    }
    return { ok: false, message: messages[error?.message || ''] || 'Não foi possível enviar a solicitação.' }
  }
  revalidatePath('/dashboard/inscricoes')
  return { ok: true, message: 'Solicitação enviada. Aguarde a decisão da organização.' }
}
