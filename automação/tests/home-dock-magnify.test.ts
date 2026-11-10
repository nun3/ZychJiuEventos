import assert from 'node:assert/strict'
import { test } from 'node:test'
import { MAGNIFY_DEFAULTS, boxDistance, magnifyTarget, springStep } from '../../components/navigation/dock-magnify'

test('magnifyTarget: máximo no ponteiro, 1 além do alcance, queda suave e monótona', () => {
  assert.equal(magnifyTarget(0, 1.2, 190), 1.2)
  assert.equal(magnifyTarget(190, 1.2, 190), 1)
  assert.equal(magnifyTarget(999, 1.2, 190), 1)
  let prev = Infinity
  for (let d = 0; d <= 190; d += 10) {
    const t = magnifyTarget(d, 1.2, 190)
    assert.ok(t <= prev + 1e-12, 'nunca sobe ao se afastar')
    assert.ok(t >= 1 && t <= 1.2)
    prev = t
  }
  assert.ok(magnifyTarget(95, 1.2, 190) < 1.2 && magnifyTarget(95, 1.2, 190) > 1)
})

test('magnifyTarget: simétrico e sem efeito com peak <= 1 ou alcance inválido', () => {
  assert.equal(magnifyTarget(-50, 1.2, 190), magnifyTarget(50, 1.2, 190))
  assert.equal(magnifyTarget(0, 1, 190), 1)
  assert.equal(magnifyTarget(0, 1.2, 0), 1)
})

test('boxDistance: centro da caixa; fora da largura penaliza pela folga horizontal', () => {
  const box = { left: 100, right: 300, top: 50, bottom: 150 }
  assert.equal(boxDistance(200, 100, box), 0)
  assert.equal(boxDistance(200, 130, box), 30)
  assert.equal(boxDistance(60, 100, box), 40)
  assert.equal(boxDistance(340, 100, box), 40)
  assert.equal(boxDistance(60, 130, box), 50)
})

test('mola do Dock (padrões): converge ao alvo e NÃO repica (superamortecida)', () => {
  let s = 1, v = 0, peak = 1
  for (let t = 0; t < 2; t += 1 / 60) {
    ;({ size: s, velocity: v } = springStep(s, v, 1.2, 1 / 60))
    peak = Math.max(peak, s)
  }
  assert.ok(Math.abs(s - 1.2) < 0.001)
  assert.ok(peak <= 1.2 + 1e-6, `passou do alvo: ${peak}`)
})

test('mola: volta ao tamanho de repouso sem passar abaixo de 1', () => {
  let s = 1.2, v = 0, low = 1.2
  for (let t = 0; t < 2; t += 1 / 60) {
    ;({ size: s, velocity: v } = springStep(s, v, 1, 1 / 60))
    low = Math.min(low, s)
  }
  assert.ok(Math.abs(s - 1) < 0.001)
  assert.ok(low >= 1 - 1e-6)
})

test('mola: tempo de assentamento curto (< 0,5 s para 98%) e estável com dt grande', () => {
  let s = 1, v = 0, at = -1
  for (let t = 0; t < 1; t += 1 / 60) {
    ;({ size: s, velocity: v } = springStep(s, v, 1.2, 1 / 60))
    if (at < 0 && s >= 1 + 0.2 * 0.98) at = t
  }
  assert.ok(at > 0 && at < 0.5, `assentou em ${at.toFixed(2)}s`)
  const big = springStep(1, 0, 1.2, 0.033)
  assert.ok(Number.isFinite(big.size) && Number.isFinite(big.velocity))
})

test('com amortecimento baixo a mola repicaria (a física responde aos parâmetros)', () => {
  let s = 1, v = 0, peak = 1
  for (let t = 0; t < 2; t += 1 / 60) {
    ;({ size: s, velocity: v } = springStep(s, v, 1.2, 1 / 60, { damping: 0.5 }))
    peak = Math.max(peak, s)
  }
  assert.ok(peak > 1.2 + 0.005)
  assert.equal(MAGNIFY_DEFAULTS.damping, 12)
})
