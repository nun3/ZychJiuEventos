'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function reviewCategoryChange(formData: FormData): Promise<{ ok: boolean; message: string }> {
  const requestId = String(formData.get('request_id') || '')
  const eventId = String(formData.get('event_id') || '')
  const decision = String(formData.get('decision') || '')
  if (!uuid.test(requestId) || !uuid.test(eventId) || !['approve', 'reject'].includes(decision)) {
    return { ok: false, message: 'Decisão inválida.' }
  }
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'Sua sessão expirou.' }
  const { data, error } = await supabase.rpc('review_category_change', {
    target_request_id: requestId,
    approve_request: decision === 'approve',
  })
  if (error || !data || typeof data !== 'object' || Array.isArray(data) || data.kind !== 'reviewed') {
    const messages: Record<string, string> = {
      'Checagem travada': 'A checagem está travada. A lista oficial não aceita alterações.',
      'Solicitacao nao esta pendente': 'Esta solicitação já foi decidida.',
      'Categoria de destino invalida': 'A categoria de destino deixou de ser válida.',
      'Sem permissao para decidir alteracao': 'Você não pode decidir solicitações deste evento.',
      'Alocacao vigente divergiu da solicitacao': 'A alocação vigente mudou. Recuse esta solicitação e peça uma nova.',
      'Evento fora da fase de checagem': 'A decisão só é permitida na fase de checagem.',
    }
    return { ok: false, message: messages[error?.message || ''] || 'Não foi possível registrar a decisão.' }
  }
  revalidatePath(`/admin/eventos/${eventId}/checagem`)
  revalidatePath('/dashboard/inscricoes')
  return { ok: true, message: decision === 'approve' ? 'Solicitação aprovada e alocação vigente atualizada.' : 'Solicitação recusada. A alocação vigente não foi alterada.' }
}

export async function lockEventChecagem(formData: FormData): Promise<{ ok: boolean; message: string }> {
  const eventId = String(formData.get('event_id') || '')
  if (!uuid.test(eventId) || formData.get('confirmed') !== 'yes') {
    return { ok: false, message: 'Confirme o travamento da lista oficial.' }
  }
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'Sua sessão expirou.' }
  const { data, error } = await supabase.rpc('lock_event_checagem', { target_event_id: eventId })
  if (error || !data || typeof data !== 'object' || Array.isArray(data) || data.kind !== 'locked') {
    const messages: Record<string, string> = {
      'Checagem ja travada': 'Esta checagem já está travada.',
      'Evento fora da fase de checagem': 'O travamento só é permitido na fase de checagem.',
      'Sem permissao para travar checagem': 'Você não pode travar a checagem deste evento.',
      'Reabertura da checagem nao permitida': 'A reabertura da checagem não está disponível.',
      'Travamento da checagem so via operacao autorizada': 'O travamento só ocorre pela ação autorizada da organização.',
    }
    return { ok: false, message: messages[error?.message || ''] || 'Não foi possível travar a checagem.' }
  }
  revalidatePath(`/admin/eventos/${eventId}/checagem`)
  return { ok: true, message: 'Checagem travada. A lista oficial não aceita novas alterações.' }
}
