export const LIVE_STATUSES = [
  'scheduled',
  'called',
  'on_mat',
  'running',
  'paused',
  'finished',
  'confirmed',
] as const

export type LiveStatus = (typeof LIVE_STATUSES)[number]

export const LIVE_EVENT_TYPES = [
  'create_session',
  'call',
  'on_mat',
  'start',
  'pause',
  'resume',
  'score',
  'advantage',
  'penalty',
  'undo',
  'finish',
  'reopen',
  'confirm',
] as const

export type LiveEventType = (typeof LIVE_EVENT_TYPES)[number]

const TRANSITIONS: Record<LiveEventType, { from: readonly LiveStatus[]; to: LiveStatus | null }> = {
  create_session: { from: [], to: 'scheduled' },
  call: { from: ['scheduled'], to: 'called' },
  on_mat: { from: ['called'], to: 'on_mat' },
  start: { from: ['on_mat'], to: 'running' },
  pause: { from: ['running'], to: 'paused' },
  resume: { from: ['paused'], to: 'running' },
  score: { from: ['running'], to: null },
  advantage: { from: ['running'], to: null },
  penalty: { from: ['running'], to: null },
  undo: { from: ['running', 'paused'], to: null },
  finish: { from: ['running', 'paused'], to: 'finished' },
  reopen: { from: ['finished'], to: 'paused' },
  confirm: { from: ['finished'], to: 'confirmed' },
}

export function isLiveStatus(value: string): value is LiveStatus {
  return LIVE_STATUSES.some((item) => item === value)
}

export function isLiveEventType(value: string): value is LiveEventType {
  return LIVE_EVENT_TYPES.some((item) => item === value)
}

export function canApplyLiveEvent(status: LiveStatus, type: LiveEventType): boolean {
  if (status === 'confirmed') return false
  return TRANSITIONS[type].from.some((item) => item === status)
}

export function nextLiveStatus(status: LiveStatus, type: LiveEventType): LiveStatus {
  if (!canApplyLiveEvent(status, type)) {
    throw new Error('Transição LIVE inválida.')
  }
  return TRANSITIONS[type].to ?? status
}

export function isTerminalLiveStatus(status: LiveStatus): boolean {
  return status === 'confirmed'
}

export function scoringAllowed(status: LiveStatus): boolean {
  return status === 'running'
}
