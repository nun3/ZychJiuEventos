import assert from 'node:assert/strict'
import test from 'node:test'
import { BELT_COLORS, TARJA_HALF_ANGLE, graduationMarkAngles, isDeclaredBelt, normalizeBelt, RING_MARK_STEP } from '../../lib/athletes/belt'

test('aro: um traço por grau, uniformes, simétricos e dentro da tarja do lado direito', () => {
  assert.deepEqual(graduationMarkAngles(0), [])
  assert.deepEqual(graduationMarkAngles(1), [0])
  assert.deepEqual(graduationMarkAngles(2), [-RING_MARK_STEP / 2, RING_MARK_STEP / 2])
  assert.equal(graduationMarkAngles(3).length, 3)
  assert.equal(graduationMarkAngles(4).length, 4)
  for (const n of [1, 2, 3, 4]) {
    const angles = graduationMarkAngles(n)
    assert.ok(Math.abs(angles.reduce((a, b) => a + b, 0)) < 1e-9, 'simétrico em torno de 0')
    assert.ok(angles.every((a) => Math.abs(a) + 2 < TARJA_HALF_ANGLE), 'todos dentro da tarja')
    const steps = angles.slice(1).map((a, i) => a - angles[i])
    assert.ok(steps.every((d) => Math.abs(d - RING_MARK_STEP) < 1e-9), 'espaçamento uniforme')
  }
})

test('aro: graus fora de 0–4 são limitados e valores inválidos viram 0', () => {
  assert.equal(graduationMarkAngles(9).length, 4)
  assert.equal(graduationMarkAngles(-2).length, 0)
  assert.equal(graduationMarkAngles(Number.NaN).length, 0)
})

test('faixa informada x padrão: não se presume faixa branca', () => {
  assert.equal(isDeclaredBelt(null), false)
  assert.equal(isDeclaredBelt(''), false)
  assert.equal(isDeclaredBelt('faixa desconhecida'), false)
  assert.equal(isDeclaredBelt('Faixa Roxa'), true)
  assert.deepEqual(normalizeBelt('roxa', 3), { belt: 'roxa', grau: 3 })
  for (const belt of ['branca', 'azul', 'roxa', 'marrom', 'preta'] as const) assert.ok(BELT_COLORS[belt].fill)
})
