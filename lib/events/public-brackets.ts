import 'server-only'

import { unstable_noStore as noStore } from 'next/cache'
import type { Json } from '@/lib/supabase/database.types'
import { createClient } from '@/lib/supabase/server'

export type PublicBracketSlot = {
  position: number
  role: 'chave' | 'copo'
  athlete: string
  team: string | null
}

export type PublicBracketMatch = {
  round: 'semifinal' | 'final'
  order: number
  sideA: string
  sideB: string
}

export type PublicBracketGroup = {
  label: string
  topology: 'final_2' | 'copo_3' | 'semi_4'
  slots: PublicBracketSlot[]
  matches: PublicBracketMatch[]
}

export type PublicBracket = {
  category: string
  mode: 'competicao' | 'sem_confronto'
  status: 'publicada'
  athlete: { name: string; team: string | null } | null
  groups: PublicBracketGroup[]
}

export type PublicBracketsResult = {
  brackets: PublicBracket[]
  error: boolean
}

function record(value: Json | undefined): Record<string, Json | undefined> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, Json | undefined>
    : null
}

function text(value: Json | undefined) {
  return typeof value === 'string' && value.trim() ? value : null
}

function number(value: Json | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function parseSlot(value: Json): PublicBracketSlot | null {
  const source = record(value)
  if (!source) return null
  const position = number(source.position)
  const athlete = text(source.athlete)
  const role = text(source.role)
  if (position === null || !athlete || (role !== 'chave' && role !== 'copo')) return null
  return { position, athlete, role, team: text(source.team) }
}

function parseMatch(value: Json): PublicBracketMatch | null {
  const source = record(value)
  if (!source) return null
  const round = text(source.round)
  const order = number(source.order)
  const sideA = text(source.sideA)
  const sideB = text(source.sideB)
  if ((round !== 'semifinal' && round !== 'final') || order === null || !sideA || !sideB) return null
  return { round, order, sideA, sideB }
}

function parseGroup(value: Json): PublicBracketGroup | null {
  const source = record(value)
  if (!source) return null
  const label = text(source.label)
  const topology = text(source.topology)
  if (!label || !['final_2', 'copo_3', 'semi_4'].includes(topology || '')) return null
  const slots = Array.isArray(source.slots) ? source.slots.map(parseSlot).filter((slot): slot is PublicBracketSlot => Boolean(slot)) : []
  const matches = Array.isArray(source.matches) ? source.matches.map(parseMatch).filter((match): match is PublicBracketMatch => Boolean(match)) : []
  return { label, topology: topology as PublicBracketGroup['topology'], slots, matches }
}

function parseBracket(value: Json): PublicBracket | null {
  const source = record(value)
  if (!source) return null
  const category = text(source.category)
  const mode = text(source.mode)
  const status = text(source.status)
  if (!category || (mode !== 'competicao' && mode !== 'sem_confronto') || status !== 'publicada') return null

  const athleteSource = record(source.athlete)
  const athleteName = athleteSource ? text(athleteSource.name) : null
  const athlete = athleteName ? { name: athleteName, team: text(athleteSource?.team) } : null
  const groups = Array.isArray(source.groups) ? source.groups.map(parseGroup).filter((group): group is PublicBracketGroup => Boolean(group)) : []

  return { category, mode, status, athlete, groups }
}

export async function getPublicEventBrackets(eventId: string): Promise<PublicBracketsResult> {
  noStore()
  const { data, error } = await createClient().rpc('get_public_event_brackets', { target_event_id: eventId })
  if (error || !Array.isArray(data)) return { brackets: [], error: true }
  return {
    brackets: data.map(parseBracket).filter((bracket): bracket is PublicBracket => Boolean(bracket)),
    error: false,
  }
}
