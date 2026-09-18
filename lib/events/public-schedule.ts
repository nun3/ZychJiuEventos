import 'server-only'

import { unstable_noStore as noStore } from 'next/cache'
import type { Json } from '@/lib/supabase/database.types'
import { parseFightDurationMinutes } from '@/lib/events/fight-duration'
import { createClient } from '@/lib/supabase/server'

export type PublicScheduleSide = {
  name: string
  team: string | null
  resolved: boolean
}

export type PublicScheduleMatch = {
  fightNumber: number
  areaNumber: number
  areaName: string
  category: string
  durationMinutes: number | null
  groupLabel: string
  round: 'semifinal' | 'final'
  order: number
  status: 'pendente' | 'concluido' | 'wo'
  sideA: PublicScheduleSide
  sideB: PublicScheduleSide
  winner: string | null
  isWalkover: boolean
}

export type PublicScheduleResult = {
  matches: PublicScheduleMatch[]
  error: boolean
}

type ObjectValue = { [key: string]: Json | undefined }

function objectValue(value: Json | undefined): ObjectValue | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null
}

function text(value: Json | undefined) {
  return typeof value === 'string' && value.trim() ? value : null
}

function number(value: Json | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function parseSide(value: Json | undefined): PublicScheduleSide | null {
  const side = objectValue(value)
  const name = text(side?.name)
  if (!side || !name) return null
  return {
    name,
    team: text(side.team),
    resolved: side.resolved === true,
  }
}

function parseMatch(value: Json): PublicScheduleMatch | null {
  const match = objectValue(value)
  const fightNumber = number(match?.fightNumber)
  const areaNumber = number(match?.areaNumber)
  const areaName = text(match?.areaName)
  const category = text(match?.category)
  const groupLabel = text(match?.groupLabel)
  const round = text(match?.round)
  const order = number(match?.order)
  const status = text(match?.status)
  const sideA = parseSide(match?.sideA)
  const sideB = parseSide(match?.sideB)
  if (
    !match
    || fightNumber === null
    || areaNumber === null
    || !areaName
    || !category
    || !groupLabel
    || (round !== 'semifinal' && round !== 'final')
    || order === null
    || !['pendente', 'concluido', 'wo'].includes(status || '')
    || !sideA
    || !sideB
  ) return null

  return {
    fightNumber,
    areaNumber,
    areaName,
    category,
    durationMinutes: parseFightDurationMinutes(match.durationMinutes),
    groupLabel,
    round,
    order,
    status: status as PublicScheduleMatch['status'],
    sideA,
    sideB,
    winner: text(match.winner),
    isWalkover: match.isWalkover === true,
  }
}

export async function getPublicEventSchedule(eventId: string): Promise<PublicScheduleResult> {
  noStore()
  const { data, error } = await createClient().rpc('get_public_event_schedule', { target_event_id: eventId })
  const payload = objectValue(data)
  if (error || !payload || payload.kind !== 'public_schedule' || !Array.isArray(payload.matches)) {
    return { matches: [], error: true }
  }
  return {
    matches: payload.matches.map(parseMatch).filter((match): match is PublicScheduleMatch => Boolean(match)),
    error: false,
  }
}
