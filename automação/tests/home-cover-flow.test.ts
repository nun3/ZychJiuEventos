import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  COVER_MAX_EVENTS,
  COVER_MIN_SLOTS,
  FIGHT_STRATEGIES,
  buildCoverSlides,
  coverPose,
  nextIndex,
  relativeCoverPosition,
} from '../../lib/home/cover-flow'

const makeEvent = (n: number) => ({
  id: `e${n}`,
  title: `Evento ${n}`,
  type: 'Campeonato',
  date: '',
  dateFull: '',
  location: 'Cidade/PR',
  daysLeft: 10,
})

test('nextIndex dá a volta nos dois sentidos', () => {
  assert.equal(nextIndex(4, 5, 1), 0)
  assert.equal(nextIndex(0, 5, -1), 4)
  assert.equal(nextIndex(2, 5, 1), 3)
  assert.equal(nextIndex(0, 5, -6), 4)
})

test('nextIndex com lista vazia não explode', () => {
  assert.equal(nextIndex(3, 0, 1), 0)
})

test('relativeCoverPosition escolhe o caminho mais curto do anel', () => {
  assert.equal(relativeCoverPosition(0, 0, 5), 0)
  assert.equal(relativeCoverPosition(1, 0, 5), 1)
  assert.equal(relativeCoverPosition(4, 0, 5), -1)
  assert.equal(relativeCoverPosition(3, 0, 5), -2)
  assert.equal(relativeCoverPosition(2, 0, 5), 2)
  assert.equal(relativeCoverPosition(0, 4, 5), 1)
  assert.equal(relativeCoverPosition(1, 0, 0), 0)
})

test('coverPose mapeia posições para as poses do CSS', () => {
  assert.equal(coverPose(0), '0')
  assert.equal(coverPose(-1), '-1')
  assert.equal(coverPose(1), '1')
  assert.equal(coverPose(-2), 'far-left')
  assert.equal(coverPose(3), 'far-right')
})

test('sem eventos, o deck é só de frases de luta', () => {
  const slides = buildCoverSlides([])
  assert.equal(slides.length, COVER_MIN_SLOTS)
  assert.ok(slides.every((slide) => slide.kind === 'strategy'))
  assert.equal(new Set(slides.map((slide) => slide.key)).size, slides.length)
})

test('cada evento real substitui uma frase, com eventos primeiro', () => {
  const slides = buildCoverSlides([makeEvent(1), makeEvent(2)])
  assert.equal(slides.length, COVER_MIN_SLOTS)
  assert.deepEqual(slides.map((slide) => slide.kind), ['event', 'event', 'strategy', 'strategy', 'strategy'])
})

test('com eventos de sobra, não sobra frase e o limite é respeitado', () => {
  const many = Array.from({ length: COVER_MAX_EVENTS + 4 }, (_, i) => makeEvent(i))
  const slides = buildCoverSlides(many)
  assert.equal(slides.length, COVER_MAX_EVENTS)
  assert.ok(slides.every((slide) => slide.kind === 'event'))
})

test('as frases cobrem o mínimo de slots sem repetir tema na primeira volta', () => {
  assert.ok(FIGHT_STRATEGIES.length >= COVER_MIN_SLOTS)
  assert.equal(new Set(FIGHT_STRATEGIES.map((s) => s.theme)).size, FIGHT_STRATEGIES.length)
})
