'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { findPublicReleaseEvent } from '@/lib/events/public-access'

export async function registerAthletes(eventId: string, form: FormData) {
  const ids = form.getAll('athlete_id').map(String)
  if (!ids.length || form.get('terms') !== 'on') return { ok: false, message: 'Selecione atletas e aceite os termos.' }
  const event = await findPublicReleaseEvent(eventId, null)
  if (!event) return { ok: false, message: 'Não foi possível concluir. Atualize a página para conferir prazo, categorias e inscrições.' }

  const names = ids.map((id) => String(form.get(`professor_name_${id}`) || '').trim())
  if (names.some((name) => name.length < 2)) {
    return { ok: false, message: 'Informe o professor operacional de cada atleta selecionado.' }
  }
  const linkSelf = ids.map((id) => form.get(`professor_link_${id}`) === 'on')

  const { data, error } = await createClient().rpc('create_event_registrations', {
    target_event_id: eventId,
    target_athlete_ids: ids,
    accepted_terms_version: 'MVP-2026-09',
    terms_accepted: true,
    operational_professor_names: names,
    operational_professor_link_self: linkSelf,
  })
  if (error) {
    const messages: Record<string, string> = {
      'Autenticacao obrigatoria': 'Sua sessão expirou. Entre novamente.',
      'Atleta ja possui inscricao ativa no evento': 'Já existe uma inscrição ativa para um dos atletas selecionados.',
      'Prazo de inscricao encerrado': 'O prazo de inscrição está encerrado.',
      'Evento fora da fase de inscricao': 'Este evento não está recebendo inscrições.',
      'Atleta fora do seu escopo': 'Você não possui permissão para inscrever um dos atletas selecionados.',
      'Evento sem conjunto de categorias ativo': 'A organização ainda não configurou as categorias.',
      'Informe o professor operacional de cada atleta': 'Informe o professor operacional de cada atleta selecionado.',
      'Somente conta Professor pode ser vinculada': 'Somente uma conta de Professor pode ser vinculada a esta inscrição.',
    }
    const operational = error.message.startsWith('Informe o professor operacional')
    return { ok: false, message: messages[error.message] || (operational ? 'Informe o professor operacional de cada atleta selecionado.' : error.code === '23505' ? 'Já existe uma inscrição ativa para este atleta.' : 'Não foi possível concluir. Atualize a página para conferir prazo, categorias e inscrições.') }
  }
  for (const id of ids) revalidatePath(`/dashboard/meus-atletas/${id}/inscricoes`)
  revalidatePath('/dashboard/inscricoes')
  revalidatePath(`/eventos/${eventId}/inscricao/cadastrar-atleta`)
  return { ok: true, message: `${data.length} inscrição(ões) criada(s). Pendente de pagamento.`, ids }
}
