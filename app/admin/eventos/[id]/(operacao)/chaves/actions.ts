'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/supabase/database.types'

export type BracketActionResult = {
  ok: boolean
  message: string
}

type BracketRpcPayload = Record<string, Json | undefined> & { kind: string }

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const errorMessages: Record<string, string> = {
  'Checagem ainda nao travada': 'Trave a checagem antes de gerar chaves.',
  'Evento fora da fase de chaves': 'As chaves só podem ser operadas nas fases de checagem ou chaves.',
  'Sem permissao para operar chaves': 'Você não pode operar as chaves deste evento.',
  'Categoria nao pertence ao evento': 'A categoria selecionada não pertence a este evento.',
  'Categoria sem inscricoes efetivadas': 'Esta categoria não possui inscrições efetivadas.',
  'Operacao concorrente na chave desta categoria': 'A chave foi alterada por outra operação. Atualize a página e tente novamente.',
  'Chave inexistente': 'A chave não foi encontrada.',
  'Somente chave em rascunho pode ser editada': 'Somente uma chave em rascunho pode ser editada.',
  'Somente chave em rascunho pode ser restaurada': 'Somente uma chave em rascunho pode ser restaurada.',
  'Somente chave em rascunho pode ser publicada': 'Somente uma chave em rascunho pode ser publicada.',
  'Somente chave publicada pode ser regenerada': 'Somente uma chave publicada pode ser regenerada.',
  'Ja existe rascunho para esta categoria': 'Já existe um rascunho para esta categoria.',
  'Composicao manual indisponivel para categoria sem confronto': 'Categorias sem confronto não possuem composição editável.',
  'Motivo obrigatorio para regenerar a chave': 'Informe um motivo com pelo menos 5 caracteres.',
}

function actionError(message: string | undefined, fallback: string): BracketActionResult {
  return { ok: false, message: errorMessages[message || ''] || fallback }
}

function isRpcPayload(data: Json, expectedKinds: string[]): data is BracketRpcPayload {
  return Boolean(
    data
    && typeof data === 'object'
    && !Array.isArray(data)
    && typeof data.kind === 'string'
    && expectedKinds.includes(data.kind),
  )
}

async function authenticatedClient() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user ? supabase : null
}

function revalidateBracketPage(eventId: string) {
  revalidatePath(`/admin/eventos/${eventId}/chaves`)
}

export async function generateCategoryBracket(formData: FormData): Promise<BracketActionResult> {
  const eventId = String(formData.get('event_id') || '')
  const categoryId = String(formData.get('category_id') || '')
  if (!uuidPattern.test(eventId) || !uuidPattern.test(categoryId)) {
    return { ok: false, message: 'Evento ou categoria inválida.' }
  }

  const supabase = await authenticatedClient()
  if (!supabase) return { ok: false, message: 'Sua sessão expirou.' }

  const { data, error } = await supabase.rpc('generate_category_bracket', {
    target_event_id: eventId,
    target_category_id: categoryId,
  })
  if (error || !isRpcPayload(data, ['draft', 'existing_draft'])) {
    return actionError(error?.message, 'Não foi possível gerar a chave.')
  }

  revalidateBracketPage(eventId)
  return { ok: true, message: data.kind === 'existing_draft' ? 'O rascunho existente foi aberto.' : 'Chave gerada em rascunho.' }
}

export async function saveCategoryBracketComposition(formData: FormData): Promise<BracketActionResult> {
  const eventId = String(formData.get('event_id') || '')
  const bracketId = String(formData.get('bracket_id') || '')
  const rawPayload = String(formData.get('groups_payload') || '')
  if (!uuidPattern.test(eventId) || !uuidPattern.test(bracketId) || !rawPayload || rawPayload.length > 100_000) {
    return { ok: false, message: 'Composição inválida.' }
  }

  let groupsPayload: Json
  try {
    groupsPayload = JSON.parse(rawPayload) as Json
  } catch {
    return { ok: false, message: 'Composição inválida.' }
  }
  if (!groupsPayload || typeof groupsPayload !== 'object' || Array.isArray(groupsPayload) || !Array.isArray(groupsPayload.groups)) {
    return { ok: false, message: 'Composição inválida.' }
  }

  const supabase = await authenticatedClient()
  if (!supabase) return { ok: false, message: 'Sua sessão expirou.' }

  const { data, error } = await supabase.rpc('save_category_bracket_composition', {
    target_bracket_id: bracketId,
    groups_payload: groupsPayload,
  })
  if (error || !isRpcPayload(data, ['saved'])) {
    return actionError(error?.message, 'Não foi possível salvar a composição.')
  }

  revalidateBracketPage(eventId)
  return { ok: true, message: 'Composição salva.' }
}

export async function restoreCategoryBracketSuggestion(formData: FormData): Promise<BracketActionResult> {
  const eventId = String(formData.get('event_id') || '')
  const bracketId = String(formData.get('bracket_id') || '')
  if (!uuidPattern.test(eventId) || !uuidPattern.test(bracketId)) {
    return { ok: false, message: 'Chave inválida.' }
  }

  const supabase = await authenticatedClient()
  if (!supabase) return { ok: false, message: 'Sua sessão expirou.' }

  const { data, error } = await supabase.rpc('restore_category_bracket_suggestion', {
    target_bracket_id: bracketId,
  })
  if (error || !isRpcPayload(data, ['restored'])) {
    return actionError(error?.message, 'Não foi possível restaurar a sugestão.')
  }

  revalidateBracketPage(eventId)
  return { ok: true, message: 'Sugestão automática restaurada.' }
}

export async function publishCategoryBracket(formData: FormData): Promise<BracketActionResult> {
  const eventId = String(formData.get('event_id') || '')
  const bracketId = String(formData.get('bracket_id') || '')
  if (!uuidPattern.test(eventId) || !uuidPattern.test(bracketId)) {
    return { ok: false, message: 'Chave inválida.' }
  }

  const supabase = await authenticatedClient()
  if (!supabase) return { ok: false, message: 'Sua sessão expirou.' }

  const { data, error } = await supabase.rpc('publish_category_bracket', {
    target_bracket_id: bracketId,
  })
  if (error || !isRpcPayload(data, ['publicada'])) {
    return actionError(error?.message, 'Não foi possível publicar a chave.')
  }

  revalidateBracketPage(eventId)
  return { ok: true, message: 'Chave publicada. Ela agora está somente para leitura.' }
}

export async function regenerateCategoryBracket(formData: FormData): Promise<BracketActionResult> {
  const eventId = String(formData.get('event_id') || '')
  const bracketId = String(formData.get('bracket_id') || '')
  const reason = String(formData.get('reason') || '').trim()
  if (!uuidPattern.test(eventId) || !uuidPattern.test(bracketId) || reason.length < 5) {
    return { ok: false, message: 'Informe uma chave válida e um motivo com pelo menos 5 caracteres.' }
  }

  const supabase = await authenticatedClient()
  if (!supabase) return { ok: false, message: 'Sua sessão expirou.' }

  const { data, error } = await supabase.rpc('regenerate_category_bracket', {
    target_bracket_id: bracketId,
    reason,
  })
  if (error || !isRpcPayload(data, ['regenerated'])) {
    return actionError(error?.message, 'Não foi possível regenerar a chave.')
  }

  revalidateBracketPage(eventId)
  return { ok: true, message: 'Nova versão criada em rascunho.' }
}
