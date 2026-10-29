import assert from 'node:assert/strict'
import test from 'node:test'
import { formatMatchClock, remainingMatchMs } from '../../lib/live/clock'
import { isLiveVersionConflict, mapLiveError } from '../../lib/live/errors'
import {
  canApplyLiveEvent,
  isTerminalLiveStatus,
  nextLiveStatus,
  scoringAllowed,
} from '../../lib/live/lifecycle'
import { createLiveIdempotencyKey, isIdenticalLiveCommand } from '../../lib/live/idempotency'
import {
  buildJiuJitsuV1Ruleset,
  fightDurationMinutesToSeconds,
  isAllowedLiveScoreValue,
} from '../../lib/live/ruleset'
import { projectScoreWinnerHint } from '../../lib/live/winner-hint'

test('ruleset jiu_jitsu@v1 snapshota duração da categoria em segundos', () => {
  const snapshot = buildJiuJitsuV1Ruleset(5)
  assert.equal(snapshot.sport, 'jiu_jitsu')
  assert.equal(snapshot.version, 1)
  assert.equal(snapshot.duration_seconds, 300)
  assert.deepEqual(snapshot.scores, [2, 3, 4])
  assert.equal(fightDurationMinutesToSeconds(2.5), 150)
  assert.equal(isAllowedLiveScoreValue(4), true)
  assert.equal(isAllowedLiveScoreValue(5), false)
})

test('lifecycle rejeita pontuação fora de running e confirmação terminal', () => {
  assert.equal(canApplyLiveEvent('scheduled', 'score'), false)
  assert.equal(canApplyLiveEvent('running', 'score'), true)
  assert.equal(scoringAllowed('paused'), false)
  assert.equal(nextLiveStatus('running', 'pause'), 'paused')
  assert.equal(nextLiveStatus('finished', 'reopen'), 'paused')
  assert.equal(nextLiveStatus('finished', 'confirm'), 'confirmed')
  assert.equal(canApplyLiveEvent('confirmed', 'reopen'), false)
  assert.equal(isTerminalLiveStatus('confirmed'), true)
  assert.throws(() => nextLiveStatus('scheduled', 'pause'))
})

test('idempotency key só aceita replay com o mesmo comando', () => {
  const base = { type: 'score' as const, competitorSide: 'a' as const, value: 2, targetEventId: null }
  assert.equal(isIdenticalLiveCommand(base, base), true)
  assert.equal(isIdenticalLiveCommand(base, { ...base, value: 3 }), false)
  assert.equal(isIdenticalLiveCommand(base, { ...base, type: 'advantage', value: null }), false)
})

test('createLiveIdempotencyKey respeita o intervalo 8–128 do domínio', () => {
  const key = createLiveIdempotencyKey('score')
  assert.ok(key.length >= 8)
  assert.ok(key.length <= 128)
  assert.ok(key.startsWith('score-'))
})

test('sugestão de vencedor pelo placar é só hint de UI', () => {
  assert.equal(projectScoreWinnerHint({
    scoreA: 4, scoreB: 2, advantagesA: 0, advantagesB: 3, penaltiesA: 1, penaltiesB: 0,
  }), 'a')
  assert.equal(projectScoreWinnerHint({
    scoreA: 2, scoreB: 2, advantagesA: 1, advantagesB: 0, penaltiesA: 0, penaltiesB: 0,
  }), 'a')
  assert.equal(projectScoreWinnerHint({
    scoreA: 2, scoreB: 2, advantagesA: 1, advantagesB: 1, penaltiesA: 2, penaltiesB: 0,
  }), 'b')
  assert.equal(projectScoreWinnerHint({
    scoreA: 0, scoreB: 0, advantagesA: 0, advantagesB: 0, penaltiesA: 0, penaltiesB: 0,
  }), 'tie')
})

test('mapa de erros LIVE traduz mensagens SQL para PT-BR operacional', () => {
  assert.equal(
    mapLiveError('Conflito de versao LIVE', 'fallback'),
    'Outra mesa atualizou esta luta. O placar foi sincronizado.',
  )
  assert.equal(
    mapLiveError('ERROR: Conflito de versao LIVE', 'fallback'),
    'Outra mesa atualizou esta luta. O placar foi sincronizado.',
  )
  assert.equal(isLiveVersionConflict('Conflito de versao LIVE'), true)
  assert.equal(
    mapLiveError('Sem permissao gerencial LIVE', 'fallback'),
    'Somente a organização pode confirmar o resultado.',
  )
  assert.equal(mapLiveError('mensagem desconhecida xyz', 'fallback'), 'fallback')
})

test('cronômetro reconstrói tempo restante a partir de timestamps persistidos', () => {
  const startedAt = Date.parse('2026-10-25T12:00:00.000Z')
  const now = startedAt + 90_000
  const remaining = remainingMatchMs({
    status: 'running',
    durationSeconds: 300,
    startedAt: '2026-10-25T12:00:00.000Z',
    pausedAt: null,
    accumulatedPauseMs: 0,
  }, now)
  assert.equal(remaining, 210_000)
  assert.equal(formatMatchClock(remaining), '03:30')

  const pausedRemaining = remainingMatchMs({
    status: 'paused',
    durationSeconds: 300,
    startedAt: '2026-10-25T12:00:00.000Z',
    pausedAt: '2026-10-25T12:01:00.000Z',
    accumulatedPauseMs: 0,
  }, Date.parse('2026-10-25T12:05:00.000Z'))
  assert.equal(pausedRemaining, 240_000)
})
