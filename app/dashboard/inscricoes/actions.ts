'use server'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import { revalidatePath } from 'next/cache'

type PaymentMethod = Database['public']['Enums']['payment_method']

export type ReservePaymentState = {
  error: string | null
  summary: {
    paymentId: string
    externalReference: string
    total: number
    registrationCount: number
    method: PaymentMethod
  } | null
}

export async function reservePayment(
  _previous: ReservePaymentState,
  formData: FormData,
): Promise<ReservePaymentState> {
  try {
    return await reserve(formData)
  } catch {
    // A network failure may occur after commit. Never blindly retry a reservation.
    return { error: 'Não foi possível confirmar o resultado. Atualize a página e consulte os pagamentos reservados antes de tentar novamente.', summary: null }
  }
}

async function reserve(formData: FormData): Promise<ReservePaymentState> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sua sessão expirou. Entre novamente.', summary: null }

  const eventId = String(formData.get('eventId') || '')
  const method = String(formData.get('method') || '')
  const registrationIds = formData.getAll('registrationId').map(String).filter(Boolean)
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuid.test(eventId) || !['pix', 'boleto'].includes(method) || !registrationIds.length || registrationIds.length > 100 || registrationIds.some(id => !uuid.test(id)) || new Set(registrationIds).size !== registrationIds.length) {
    return { error: 'Selecione inscrições e uma forma de pagamento.', summary: null }
  }

  // The browser supplies IDs and method only. Permissions and total belong to the RPC.
  const { data: phase, error: phaseError } = await supabase.from('event_phases')
    .select('inicio, fim').eq('event_id', eventId).eq('tipo', 'pagamento').maybeSingle()
  const now = Date.now()
  if (phaseError || !phase || now < Date.parse(phase.inicio) || now > Date.parse(phase.fim)) {
    return { error: 'Este evento está fora do prazo de pagamento.', summary: null }
  }
  const { data, error } = await supabase.rpc('reserve_payment_batch', {
    target_event_id: eventId,
    target_registration_ids: registrationIds,
    target_method: method as PaymentMethod,
  })
  if (error || !data?.[0]) {
    const messages: Record<string, string> = {
      'Inscricao ja possui pagamento ativo': 'Uma inscrição selecionada já possui pagamento ativo. Atualize a página.',
      'Inscricoes devem pertencer ao mesmo evento': 'Selecione inscrições do mesmo evento.',
      'Inscricao sem permissao': 'Não foi possível reservar as inscrições selecionadas.',
      'Inscricao inexistente': 'Não foi possível reservar as inscrições selecionadas.',
      'Evento fora da fase de pagamento': 'Este evento não está na fase de pagamento.',
      'Inscricao nao esta pendente de pagamento': 'Uma inscrição selecionada não está pendente de pagamento.',
    }
    return { error: messages[error?.message || ''] || 'Não foi possível reservar o pagamento. Atualize a página antes de tentar novamente.', summary: null }
  }

  const reservation = data[0]
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('id, external_reference, valor_total, metodo, payment_registrations(count)')
    .eq('id', reservation.payment_id)
    .eq('created_by', user.id)
    .single()
  if (paymentError || !payment) {
    return { error: 'Reserva criada, mas não foi possível carregar o resumo persistido.', summary: null }
  }

  revalidatePath('/dashboard/inscricoes')
  return {
    error: null,
    summary: {
      paymentId: payment.id,
      externalReference: payment.external_reference || reservation.external_reference,
      total: payment.valor_total,
      registrationCount: payment.payment_registrations?.[0]?.count || reservation.registration_count,
      method: payment.metodo,
    },
  }
}
