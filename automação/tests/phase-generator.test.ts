import assert from 'node:assert/strict'
import { PHASE_VARIANTS, generatePhases, pickEventDate, registrationDays, wallNow } from '../../lib/events/phase-generator'

const now = Date.UTC(2026, 10, 10, 10, 30) // 10/11/2026 10:30

function check(name: string, fn: () => void) { fn(); console.log(`ok - ${name}`) }

check('evento distante: linha do tempo ideal, em ordem e sem sobreposição', () => {
  const r = generatePhases('2027-01-20', 'manha', now)
  assert.ok(r.ok)
  if (!r.ok) return
  assert.equal(r.phases.inscricao.inicio, '2026-12-21T09:00')
  assert.equal(r.phases.inscricao.fim, '2027-01-13T23:59')
  assert.equal(r.phases.chaves.fim, '2027-01-20T06:00')
  const order = ['inscricao', 'pagamento', 'checagem', 'chaves'] as const
  for (let i = 0; i < order.length; i += 1) {
    assert.ok(r.phases[order[i]].inicio < r.phases[order[i]].fim)
    if (i) assert.ok(r.phases[order[i]].inicio >= r.phases[order[i - 1]].fim)
  }
})

check('turno muda só o fechamento das chaves', () => {
  const tarde = generatePhases('2027-01-20', 'tarde', now)
  const noite = generatePhases('2027-01-20', 'noite', now)
  assert.ok(tarde.ok && noite.ok)
  if (tarde.ok && noite.ok) {
    assert.equal(tarde.phases.chaves.fim, '2027-01-20T11:00')
    assert.equal(noite.phases.chaves.fim, '2027-01-20T16:00')
    assert.equal(tarde.phases.inscricao.inicio, noite.phases.inscricao.inicio)
  }
})

check('data próxima: inscrição começa na próxima hora cheia e tudo continua em ordem', () => {
  const r = generatePhases('2026-11-20', 'noite', now)
  assert.ok(r.ok)
  if (!r.ok) return
  assert.equal(r.phases.inscricao.inicio, '2026-11-10T11:00')
  assert.ok(r.phases.pagamento.inicio >= r.phases.inscricao.fim)
  assert.ok(r.phases.chaves.fim === '2026-11-20T16:00')
})

check('data muito próxima ou inválida devolve erro', () => {
  assert.equal(generatePhases('2026-11-10', 'manha', now).ok, false)
  assert.equal(generatePhases('', 'manha', now).ok, false)
})

check('wallNow devolve o relógio de parede do fuso', () => {
  const ms = wallNow('America/Sao_Paulo', new Date('2026-11-10T15:00:00Z'))
  assert.equal(new Date(ms).getUTCHours(), 12)
})

check('pickEventDate escolhe o primeiro sábado em que cabe e respeita o turno', () => {
  const r = pickEventDate(2027, 1, 'tarde', now)
  assert.ok(r.ok)
  if (r.ok) {
    assert.equal(r.date, '2027-01-02')
    assert.equal(new Date(`${r.date}T00:00:00Z`).getUTCDay(), 6)
    assert.equal(r.phases.chaves.fim, '2027-01-02T11:00')
  }
})

check('pickEventDate pula sábados próximos demais e falha no mês já passado', () => {
  const r = pickEventDate(2026, 11, 'manha', now)
  assert.ok(r.ok)
  if (r.ok) assert.ok(r.date >= '2026-11-14')
  assert.equal(pickEventDate(2026, 9, 'manha', now).ok, false)
})

check('perfis geram janelas de inscrição diferentes, sempre em ordem', () => {
  const days: number[] = []
  const order = ['inscricao', 'pagamento', 'checagem', 'chaves'] as const
  for (let v = 0; v < PHASE_VARIANTS.length; v += 1) {
    const r = generatePhases('2027-03-13', 'tarde', now, v)
    assert.ok(r.ok)
    if (!r.ok) return
    days.push(registrationDays(r.phases))
    for (let i = 0; i < order.length; i += 1) {
      assert.ok(r.phases[order[i]].inicio < r.phases[order[i]].fim)
      if (i) assert.ok(r.phases[order[i]].inicio >= r.phases[order[i - 1]].fim)
    }
  }
  assert.deepEqual(days, [24, 14, 36, 8])
  assert.equal(generatePhases('2027-03-13', 'tarde', now, PHASE_VARIANTS.length)?.ok, true) // dá a volta
})
