'use server'

import { revalidatePath } from 'next/cache'
import { requirePlatformAdmin } from '@/lib/auth/platform-admin-server'
import { publicEventStatuses } from '@/lib/events/public-access'

function optionalDate(value: FormDataEntryValue | null) {
  const raw = String(value || '').trim()
  if (!raw) return null
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) throw new Error('Data de destaque inválida.')
  return date.toISOString()
}

export async function saveHighlight(formData: FormData) {
  const access = await requirePlatformAdmin()
  if (access.status !== 'ok') throw new Error('Acesso restrito ao administrador da plataforma.')
  const eventId = String(formData.get('event_id') || '')
  const position = Number(formData.get('position') || 1)
  const startsAt = optionalDate(formData.get('starts_at'))
  const endsAt = optionalDate(formData.get('ends_at'))
  if (!eventId || !Number.isInteger(position) || position < 1) throw new Error('Evento ou posição inválida.')
  if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) throw new Error('O fim deve ser posterior ao início.')

  const { data: event } = await access.supabase.from('events').select('id, status').eq('id', eventId).single()
  if (!event || !publicEventStatuses.some((status) => status === event.status)) throw new Error('O evento não está elegível para destaque público.')
  const { error } = await access.supabase.from('home_event_highlights').upsert({
    event_id: eventId,
    position,
    pinned: formData.get('pinned') === 'on',
    hidden: formData.get('hidden') === 'on',
    starts_at: startsAt,
    ends_at: endsAt,
    created_by: access.user.id,
    updated_at: new Date().toISOString(),
  })
  if (error) throw new Error('Não foi possível salvar o destaque.')
  revalidatePath('/')
  revalidatePath('/platform/destaques')
}

export async function removeHighlight(formData: FormData) {
  const access = await requirePlatformAdmin()
  if (access.status !== 'ok') throw new Error('Acesso restrito ao administrador da plataforma.')
  const eventId = String(formData.get('event_id') || '')
  const { error } = await access.supabase.from('home_event_highlights').delete().eq('event_id', eventId)
  if (error) throw new Error('Não foi possível remover o destaque.')
  revalidatePath('/')
  revalidatePath('/platform/destaques')
}
