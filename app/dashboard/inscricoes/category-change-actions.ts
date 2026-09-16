'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type EligibleCategory = { id: string; nome: string }

export async function listEligibleCategoryChanges(registrationId: string): Promise<EligibleCategory[]> {
  if (!uuid.test(registrationId)) return []
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data, error } = await supabase.rpc('list_eligible_category_changes', { target_registration_id: registrationId })
  if (error || !data) return []
  return data
}

export async function requestCategoryChange(formData: FormData): Promise<{ ok: boolean; message: string }> {
  const registrationId = String(formData.get('registration_id') || '')
  const categoryId = String(formData.get('requested_category_id') || '')
  const reason = String(formData.get('reason') || '').trim()
  if (!uuid.test(registrationId) || !uuid.test(categoryId) || reason.length < 5) {
    return { ok: false, message: 'Selecione uma categoria e informe um motivo com ao menos 5 caracteres.' }
  }
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'Sua sessão expirou.' }
  const { data, error } = await supabase.rpc('request_category_change', {
    target_registration_id: registrationId,
    requested_category_id: categoryId,
    reason_text: reason,
  })
  if (error || !data || typeof data !== 'object' || Array.isArray(data) || data.kind !== 'requested') {
    const messages: Record<string, string> = {
      'Atleta nao esta sozinho na categoria': 'Só é possível solicitar mudança quando o atleta está sozinho na categoria vigente.',
      'Checagem travada': 'A checagem está travada. Novas solicitações não são aceitas.',
      'Evento fora da fase de checagem': 'A solicitação só é permitida na fase de checagem.',
      'Ja existe solicitacao pendente': 'Já existe uma solicitação pendente para esta inscrição.',
      'Categoria de destino invalida': 'A categoria escolhida não é elegível para esta inscrição.',
      'Sem permissao para solicitar alteracao': 'Você não pode solicitar alteração desta inscrição.',
      'Inscricao nao efetivada': 'Somente inscrições efetivadas entram na checagem.',
    }
    return { ok: false, message: messages[error?.message || ''] || 'Não foi possível enviar a solicitação.' }
  }
  revalidatePath('/dashboard/inscricoes')
  return { ok: true, message: 'Solicitação enviada. Aguarde a decisão da organização.' }
}
