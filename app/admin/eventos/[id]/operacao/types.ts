import type { LiveStatus } from '@/lib/live/lifecycle'

export type LiveSide = 'a' | 'b'
export type LiveResultType =
  | 'points'
  | 'submission'
  | 'disqualification'
  | 'walkover'
  | 'referee_decision'
  | 'other'

export type LiveActorRole = 'owner' | 'organizer' | 'staff' | 'admin'

export type LiveSessionPayload = {
  id: string
  eventId: string
  matchId: string
  areaId: string | null
  status: LiveStatus
  rulesetSnapshot: Record<string, unknown> | null
  durationSeconds: number
  startedAt: string | null
  pausedAt: string | null
  accumulatedPauseMs: number
  finishedAt: string | null
  confirmedAt: string | null
  winnerSide: LiveSide | null
  resultType: LiveResultType | null
  scoreA: number
  scoreB: number
  advantagesA: number
  advantagesB: number
  penaltiesA: number
  penaltiesB: number
  version: number
  lastEventSequence: number
  operatorId: string | null
  updatedAt: string | null
  duplicate?: boolean
  lastEventId?: string | null
}

export type OperatorAthlete = {
  entryId: string
  name: string
  team: string | null
}

export type OperatorQueueMatch = {
  matchId: string
  fightNumber: number
  round: 'semifinal' | 'final'
  status: 'pendente' | 'concluido' | 'wo'
  category: string
  groupLabel: string
  sideA: OperatorAthlete | null
  sideB: OperatorAthlete | null
  session: LiveSessionPayload | null
}

export type OperatorArea = {
  areaId: string
  number: number
  name: string
  active: boolean
}

export type OperatorPageData = {
  event: {
    id: string
    name: string
    status: string
    local: string | null
  }
  actorRole: LiveActorRole
  canConfirm: boolean
  areas: OperatorArea[]
  queueByArea: Record<string, OperatorQueueMatch[]>
  sessionsByMatchId: Record<string, LiveSessionPayload>
}

export type LiveActionResult =
  | { ok: true; session: LiveSessionPayload; conflict?: false }
  | { ok: false; message: string; conflict?: boolean; session?: LiveSessionPayload | null }
