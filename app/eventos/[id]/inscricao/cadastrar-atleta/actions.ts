'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
export async function registerAthletes(eventId: string, form: FormData) {
  const ids = form.getAll('athlete_id').map(String)
  if (!ids.length || form.get('terms') !== 'on') return { ok: false, message: 'Selecione atletas e aceite os termos.' }
  const { data, error } = await createClient().rpc('create_event_registrations', { target_event_id: eventId, target_athlete_ids: ids, accepted_terms_version: 'MVP-2026-09', terms_accepted: true })
  if (error) {
    const messages: Record<string, string> = {
      'Autenticacao obrigatoria': 'Sua sessão expirou. Entre novamente.',
      'Atleta ja possui inscricao ativa no evento': 'Já existe uma inscrição ativa para um dos atletas selecionados.',
      'Prazo de inscricao encerrado': 'O prazo de inscrição está encerrado.',
      'Evento fora da fase de inscricao': 'Este evento não está recebendo inscrições.',
      'Atleta fora do seu escopo': 'Você não possui permissão para inscrever um dos atletas selecionados.',
      'Evento sem conjunto de categorias ativo': 'A organização ainda não configurou as categorias.',
    }
    return { ok: false, message: messages[error.message] || (error.code === '23505' ? 'Já existe uma inscrição ativa para este atleta.' : 'Não foi possível concluir. Atualize a página para conferir prazo, categorias e inscrições.') }
  }
  for (const id of ids) revalidatePath(`/dashboard/meus-atletas/${id}/inscricoes`)
  revalidatePath('/dashboard/inscricoes')
  revalidatePath(`/eventos/${eventId}/inscricao/cadastrar-atleta`)
  return { ok: true, message: `${data.length} inscrição(ões) criada(s). Pendente de pagamento.`, ids }
}
