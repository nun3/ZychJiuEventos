'use server'

import { revalidatePath } from 'next/cache'
import type { Json } from '@/lib/supabase/database.types'
import { createClient } from '@/lib/supabase/server'

export type ResultActionState = { ok: boolean; message: string }

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const errorMessages: Record<string, string> = {
  'Chave inexistente': 'A chave não foi encontrada.',
  'Confronto inexistente': 'O confronto não foi encontrado.',
  'Categoria sem confronto nao possui operacao': 'Categorias sem confronto não possuem resultados.',
  'Somente chave publicada pode iniciar operacao': 'Somente uma chave publicada pode iniciar a operação.',
  'Evento fora da fase de resultados': 'Avance o evento para a fase de chaves antes de iniciar as lutas.',
  'Chave fora de operacao': 'Esta chave não está em operação.',
  'Confronto ja possui resultado': 'Este confronto já possui resultado e não pode ser alterado.',
  'Confronto ainda sem os dois lados resolvidos': 'Aguarde os confrontos anteriores para definir os dois lados.',
  'Vencedor nao pertence ao confronto': 'O vencedor selecionado não pertence a este confronto.',
  'Sem permissao para operar chaves': 'Você não pode operar resultados deste evento.',
  'Operacao concorrente na chave desta categoria': 'A chave foi alterada por outra operação. Atualize e tente novamente.',
}

function validPayload(data: Json) {
  return Boolean(
    data
    && typeof data === 'object'
    && !Array.isArray(data)
    && data.kind === 'operation',
  )
}

async function authenticatedClient() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user ? supabase : null
}

function refresh(eventId: string) {
  revalidatePath(`/admin/eventos/${eventId}/resultados`)
  revalidatePath(`/admin/eventos/${eventId}/chaves`)
  revalidatePath(`/eventos/${eventId}/chaves`)
  revalidatePath(`/eventos/${eventId}`)
}

export async function startCategoryBracket(formData: FormData): Promise<ResultActionState> {
  const eventId = String(formData.get('event_id') || '')
  const bracketId = String(formData.get('bracket_id') || '')
  if (!uuidPattern.test(eventId) || !uuidPattern.test(bracketId)) {
    return { ok: false, message: 'Evento ou chave inválida.' }
  }

  const supabase = await authenticatedClient()
  if (!supabase) return { ok: false, message: 'Sua sessão expirou.' }
  const { data, error } = await supabase.rpc('start_category_bracket', { target_bracket_id: bracketId })
  if (error || !validPayload(data)) {
    return { ok: false, message: errorMessages[error?.message || ''] || 'Não foi possível iniciar a operação.' }
  }

  refresh(eventId)
  return { ok: true, message: 'Operação iniciada. O evento está em andamento.' }
}

export async function recordBracketMatchOutcome(formData: FormData): Promise<ResultActionState> {
  const eventId = String(formData.get('event_id') || '')
  const matchId = String(formData.get('match_id') || '')
  const winnerEntryId = String(formData.get('winner_entry_id') || '')
  const outcome = String(formData.get('outcome') || '')
  if (
    !uuidPattern.test(eventId)
    || !uuidPattern.test(matchId)
    || !uuidPattern.test(winnerEntryId)
    || !['concluido', 'wo'].includes(outcome)
  ) {
    return { ok: false, message: 'Resultado inválido.' }
  }

  const supabase = await authenticatedClient()
  if (!supabase) return { ok: false, message: 'Sua sessão expirou.' }
  const { data, error } = await supabase.rpc('record_bracket_match_outcome', {
    target_match_id: matchId,
    target_winner_entry_id: winnerEntryId,
    outcome: outcome as 'concluido' | 'wo',
  })
  if (error || !validPayload(data)) {
    return { ok: false, message: errorMessages[error?.message || ''] || 'Não foi possível registrar o resultado.' }
  }

  refresh(eventId)
  return {
    ok: true,
    message: outcome === 'wo' ? 'WO registrado e vencedor avançado.' : 'Resultado registrado e vencedor avançado.',
  }
}
