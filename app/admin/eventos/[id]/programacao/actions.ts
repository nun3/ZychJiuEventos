'use server'

import { revalidatePath } from 'next/cache'
import type { Json } from '@/lib/supabase/database.types'
import { createClient } from '@/lib/supabase/server'

export type ScheduleActionState = { ok: boolean; message: string }

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const errorMessages: Record<string, string> = {
  'Evento inexistente': 'O evento não foi encontrado.',
  'Area inexistente': 'A área não foi encontrada.',
  'Area ativa inexistente neste evento': 'Selecione uma área ativa deste evento.',
  'Subchave inexistente': 'A subchave não foi encontrada.',
  'Subchave nao esta programada': 'A subchave ainda não está programada.',
  'Somente subchave oficial pode ser programada': 'Somente subchaves oficiais publicadas podem ser programadas.',
  'Programacao editavel somente na fase de chaves': 'A programação só pode ser editada na fase de chaves.',
  'Programacao publicada nao pode ser alterada': 'A programação publicada está congelada.',
  'Numero de area ja utilizado': 'Já existe uma área com esse número.',
  'Area com subchave atribuida nao pode ser desativada': 'Mova ou remova as subchaves antes de desativar esta área.',
  'Ordem deve conter exatamente todas as lutas programadas': 'A fila mudou. Atualize a página e tente novamente.',
  'Luta dependente deve permanecer depois das lutas de origem': 'A final deve permanecer depois das semifinais que a alimentam.',
  'Todas as subchaves oficiais devem possuir area': 'Atribua uma área a todas as subchaves antes de publicar.',
  'Todas as lutas oficiais devem estar numeradas': 'Todas as lutas precisam estar na fila antes de publicar.',
  'Evento sem subchaves oficiais para programar': 'Publique ao menos uma chave com confrontos antes de programar.',
  'Sem permissao para operar programacao': 'Você não pode alterar a programação deste evento.',
}

async function authenticatedClient() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user ? supabase : null
}

function validResult(data: Json) {
  return Boolean(data && typeof data === 'object' && !Array.isArray(data) && typeof data.kind === 'string')
}

function errorMessage(message: string | undefined, fallback: string) {
  return errorMessages[message || ''] || fallback
}

function refresh(eventId: string) {
  revalidatePath(`/admin/eventos/${eventId}/programacao`)
  revalidatePath(`/admin/eventos/${eventId}/resultados`)
}

export async function saveArea(formData: FormData): Promise<ScheduleActionState> {
  const eventId = String(formData.get('event_id') || '')
  const rawAreaId = String(formData.get('area_id') || '')
  const areaId = rawAreaId || null
  const number = Number(formData.get('number'))
  const name = String(formData.get('name') || '').trim()
  if (
    !uuidPattern.test(eventId)
    || (areaId !== null && !uuidPattern.test(areaId))
    || !Number.isInteger(number)
    || number < 1
    || number > 999
    || !name
    || name.length > 60
  ) return { ok: false, message: 'Informe número e nome válidos para a área.' }

  const supabase = await authenticatedClient()
  if (!supabase) return { ok: false, message: 'Sua sessão expirou.' }
  const { data, error } = await supabase.rpc('save_event_area', {
    target_event_id: eventId,
    target_area_id: areaId!,
    area_number: number,
    area_name: name,
  })
  if (error || !validResult(data)) {
    return { ok: false, message: errorMessage(error?.message, 'Não foi possível salvar a área.') }
  }
  refresh(eventId)
  return { ok: true, message: areaId ? 'Área atualizada.' : 'Área criada.' }
}

export async function toggleArea(formData: FormData): Promise<ScheduleActionState> {
  const eventId = String(formData.get('event_id') || '')
  const areaId = String(formData.get('area_id') || '')
  const active = String(formData.get('active')) === 'true'
  if (!uuidPattern.test(eventId) || !uuidPattern.test(areaId)) {
    return { ok: false, message: 'Área inválida.' }
  }
  const supabase = await authenticatedClient()
  if (!supabase) return { ok: false, message: 'Sua sessão expirou.' }
  const { data, error } = await supabase.rpc('set_event_area_active', {
    target_area_id: areaId,
    next_active: active,
  })
  if (error || !validResult(data)) {
    return { ok: false, message: errorMessage(error?.message, 'Não foi possível alterar a área.') }
  }
  refresh(eventId)
  return { ok: true, message: active ? 'Área ativada.' : 'Área desativada.' }
}

export async function assignGroup(formData: FormData): Promise<ScheduleActionState> {
  const eventId = String(formData.get('event_id') || '')
  const groupId = String(formData.get('group_id') || '')
  const areaId = String(formData.get('area_id') || '')
  if (![eventId, groupId, areaId].every((value) => uuidPattern.test(value))) {
    return { ok: false, message: 'Subchave ou área inválida.' }
  }
  const supabase = await authenticatedClient()
  if (!supabase) return { ok: false, message: 'Sua sessão expirou.' }
  const { data, error } = await supabase.rpc('assign_schedule_group', {
    target_group_id: groupId,
    target_area_id: areaId,
  })
  if (error || !validResult(data)) {
    return { ok: false, message: errorMessage(error?.message, 'Não foi possível atribuir a subchave.') }
  }
  refresh(eventId)
  return { ok: true, message: 'Subchave e todas as suas lutas foram atribuídas.' }
}

export async function unassignGroup(formData: FormData): Promise<ScheduleActionState> {
  const eventId = String(formData.get('event_id') || '')
  const groupId = String(formData.get('group_id') || '')
  if (!uuidPattern.test(eventId) || !uuidPattern.test(groupId)) {
    return { ok: false, message: 'Subchave inválida.' }
  }
  const supabase = await authenticatedClient()
  if (!supabase) return { ok: false, message: 'Sua sessão expirou.' }
  const { data, error } = await supabase.rpc('unassign_schedule_group', { target_group_id: groupId })
  if (error || !validResult(data)) {
    return { ok: false, message: errorMessage(error?.message, 'Não foi possível remover a subchave da programação.') }
  }
  refresh(eventId)
  return { ok: true, message: 'Subchave removida e numeração recalculada.' }
}

export async function reorderSchedule(formData: FormData): Promise<ScheduleActionState> {
  const eventId = String(formData.get('event_id') || '')
  let matchIds: string[] = []
  try {
    const parsed = JSON.parse(String(formData.get('match_ids') || '[]'))
    if (Array.isArray(parsed)) matchIds = parsed.map(String)
  } catch {
    return { ok: false, message: 'Ordem de lutas inválida.' }
  }
  if (!uuidPattern.test(eventId) || matchIds.length === 0 || !matchIds.every((id) => uuidPattern.test(id))) {
    return { ok: false, message: 'Ordem de lutas inválida.' }
  }
  const supabase = await authenticatedClient()
  if (!supabase) return { ok: false, message: 'Sua sessão expirou.' }
  const { data, error } = await supabase.rpc('reorder_event_schedule', {
    target_event_id: eventId,
    ordered_match_ids: matchIds,
  })
  if (error || !validResult(data)) {
    return { ok: false, message: errorMessage(error?.message, 'Não foi possível reordenar as lutas.') }
  }
  refresh(eventId)
  return { ok: true, message: 'Fila global reordenada e números recalculados.' }
}

export async function publishSchedule(formData: FormData): Promise<ScheduleActionState> {
  const eventId = String(formData.get('event_id') || '')
  if (!uuidPattern.test(eventId)) return { ok: false, message: 'Evento inválido.' }
  const supabase = await authenticatedClient()
  if (!supabase) return { ok: false, message: 'Sua sessão expirou.' }
  const { data, error } = await supabase.rpc('publish_event_schedule', { target_event_id: eventId })
  if (error || !validResult(data)) {
    return { ok: false, message: errorMessage(error?.message, 'Não foi possível publicar a programação.') }
  }
  refresh(eventId)
  return { ok: true, message: 'Programação publicada. Áreas e números estão congelados.' }
}
