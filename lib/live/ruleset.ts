import { isValidFightDurationMinutes, normalizeFightDurationMinutes } from '../events/fight-duration'

export const LIVE_SPORT = 'jiu_jitsu' as const
export const LIVE_RULESET_VERSION = 1 as const
export const LIVE_SCORE_VALUES = [2, 3, 4] as const

export type LiveRulesetSnapshot = {
  sport: typeof LIVE_SPORT
  version: typeof LIVE_RULESET_VERSION
  duration_seconds: number
  scores: typeof LIVE_SCORE_VALUES
  advantages: true
  penalties: true
}

export function fightDurationMinutesToSeconds(minutes: number): number {
  if (!isValidFightDurationMinutes(minutes)) {
    throw new Error('Duração oficial da luta inválida.')
  }
  return Math.round(normalizeFightDurationMinutes(minutes) * 60)
}

/** Snapshot imutável gravado na sessão LIVE no momento da criação. */
export function buildJiuJitsuV1Ruleset(durationMinutes: number): LiveRulesetSnapshot {
  return {
    sport: LIVE_SPORT,
    version: LIVE_RULESET_VERSION,
    duration_seconds: fightDurationMinutesToSeconds(durationMinutes),
    scores: LIVE_SCORE_VALUES,
    advantages: true,
    penalties: true,
  }
}

export function isAllowedLiveScoreValue(value: number): boolean {
  return LIVE_SCORE_VALUES.some((item) => item === value)
}
