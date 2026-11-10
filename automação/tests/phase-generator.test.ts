import assert from 'node:assert/strict'
import {
  PHASE_KEYS, buildPhases, candidatesFor, saturdaysOfMonth, scheduleWarnings, suggestSchedule, validatePhases, wallNow,
  type EventShift, type RegistrationProfile,
} from '../../lib/events/phase-generator'

const at = (y: number, m: number, d: number, h = 10, min = 0) => Date.UTC(y, m - 1, d, h, min)
const now = at(2026, 11, 10, 10, 30) // terça, 10/11/2026 10:30
const profiles: RegistrationProfile[] = ['curto', 'equilibrado', 'longo']
const shifts: EventShift[] = ['manha', 'tarde', 'noite']

function check(name: string, fn: () => void) { fn(); console.log(`ok - ${name}`) }
function assertValid(phases: Parameters<typeof validatePhases>[0]) { assert.equal(validatePhases(phases), null) }

check('sábados: meses com 4 e 5 sábados, fevereiro e bissexto', () => {
  assert.equal(saturdaysOfMonth(2026, 11).length, 4) // nov/2026
  assert.equal(saturdaysOfMonth(2026, 8).length, 5) // ago/2026
  assert.deepEqual(saturdaysOfMonth(2027, 2), ['2027-02-06', '2027-02-13', '2027-02-20', '2027-02-27'])
  assert.deepEqual(saturdaysOfMonth(2028, 2).at(-1), '2028-02-26') // bissexto (29 dias)
  for (const date of saturdaysOfMonth(2028, 2)) assert.equal(new Date(`${date}T00:00:00Z`).getUTCDay(), 6)
})

check('todos os perfis × turnos geram quatro fases válidas, em ordem e sem sobreposição', () => {
  for (const profile of profiles) for (const shift of shifts) {
    const r = suggestSchedule({ year: 2027, month: 3, shift, profile, nowWall: now })
    assert.ok(r.ok, `${profile}/${shift}`)
    if (!r.ok) return
    assertValid(r.suggestion.phases)
    assert.equal(r.suggestion.weekday, 'sábado')
    assert.deepEqual(Object.keys(r.suggestion.phases), [...PHASE_KEYS])
  }
})

check('primeiro sábado viável e horário do turno (chaves fecham 2h antes do início)', () => {
  const m = suggestSchedule({ year: 2027, month: 3, shift: 'manha', profile: 'equilibrado', nowWall: now })
  const t = suggestSchedule({ year: 2027, month: 3, shift: 'tarde', profile: 'equilibrado', nowWall: now })
  const n = suggestSchedule({ year: 2027, month: 3, shift: 'noite', profile: 'equilibrado', nowWall: now })
  assert.ok(m.ok && t.ok && n.ok)
  if (m.ok && t.ok && n.ok) {
    assert.equal(m.suggestion.date, '2027-03-06')
    assert.equal(m.suggestion.phases.chaves.fim, '2027-03-06T07:00')
    assert.equal(t.suggestion.phases.chaves.fim, '2027-03-06T12:00')
    assert.equal(n.suggestion.phases.chaves.fim, '2027-03-06T16:00')
  }
})

check('perfis: antecedência mínima respeitada e janelas de inscrição ordenadas curto < equilibrado < longo', () => {
  const dur = (profile: RegistrationProfile) => {
    const r = suggestSchedule({ year: 2027, month: 6, shift: 'manha', profile, nowWall: now })
    assert.ok(r.ok)
    if (!r.ok) return 0
    const p = r.suggestion.phases.inscricao
    return (Date.parse(`${p.fim}:00Z`) - Date.parse(`${p.inicio}:00Z`)) / 864e5
  }
  const [c, e, l] = [dur('curto'), dur('equilibrado'), dur('longo')]
  assert.ok(c < e && e < l, `${c} ${e} ${l}`)
  // equilibrado: abre 35 dias antes (limite superior da preferência), curto 14, longo 60
  const r = suggestSchedule({ year: 2027, month: 6, shift: 'manha', profile: 'equilibrado', nowWall: now })
  if (r.ok) assert.equal(r.suggestion.phases.inscricao.inicio, '2027-05-01T09:00')
})

check('data próxima: abre na próxima hora cheia, sem datas retroativas', () => {
  const r = suggestSchedule({ year: 2026, month: 12, shift: 'tarde', profile: 'curto', nowWall: now })
  assert.ok(r.ok)
  if (r.ok) {
    assert.equal(r.suggestion.date, '2026-12-05') // 25 dias: cabe, e abre no limite preferido ou agora
    assert.ok(Date.parse(`${r.suggestion.phases.inscricao.inicio}:00Z`) >= now)
  }
  const tight = suggestSchedule({ year: 2026, month: 11, shift: 'manha', profile: 'curto', nowWall: now })
  assert.ok(tight.ok)
  if (tight.ok) {
    assert.equal(tight.suggestion.date, '2026-11-21') // 14/11 tem só 4 dias; 21/11 tem 11
    assert.equal(tight.suggestion.phases.inscricao.inicio, '2026-11-10T11:00')
    assertValid(tight.suggestion.phases)
  }
})

check('mês sem sábado viável: motivo e alternativa no mês seguinte, sem trocar o mês em silêncio', () => {
  const r = suggestSchedule({ year: 2026, month: 11, shift: 'manha', profile: 'longo', nowWall: now })
  assert.equal(r.ok, false)
  if (!r.ok && r.reason === 'sem-data') {
    assert.match(r.message, /Nenhum sábado/)
    assert.deepEqual(r.alternative, { year: 2026, month: 12 }) // 10/11 + 45 dias = 25/12 → sábado 26/12 é o primeiro viável
  } else assert.fail('esperava sem-data')
  const past = suggestSchedule({ year: 2026, month: 9, shift: 'manha', profile: 'curto', nowWall: now })
  assert.equal(past.ok, false)
})

check('virada de ano e fevereiro bissexto', () => {
  const r = suggestSchedule({ year: 2027, month: 1, shift: 'manha', profile: 'longo', nowWall: at(2026, 11, 10) })
  assert.ok(r.ok)
  if (r.ok) assert.equal(r.suggestion.date, '2027-01-02')
  const leap = suggestSchedule({ year: 2028, month: 2, shift: 'noite', profile: 'equilibrado', nowWall: now })
  assert.ok(leap.ok)
  if (leap.ok) assert.ok(['2028-02-05', '2028-02-12', '2028-02-19', '2028-02-26'].includes(leap.suggestion.date))
})

check('"outra sugestão": nunca repete, ordem sábados → horários → prazos, e esgota com aviso', () => {
  const seen = new Set<string>()
  const keys: string[] = []
  for (let i = 0; i < 200; i += 1) {
    const r = suggestSchedule({ year: 2027, month: 3, shift: 'manha', profile: 'equilibrado', nowWall: now, seen })
    if (!r.ok) { assert.equal(r.reason, 'esgotado'); break }
    assert.ok(!seen.has(r.suggestion.key))
    assertValid(r.suggestion.phases)
    seen.add(r.suggestion.key); keys.push(r.suggestion.key)
  }
  assert.equal(new Set(keys).size, keys.length)
  assert.ok(keys.length >= candidatesFor(2027, 3, 'manha').length - 4) // quase todas as combinações
  assert.equal(keys[0].split('|')[0], '2027-03-06')
  assert.equal(keys[1].split('|')[0], '2027-03-13') // outros sábados antes de variar o horário
  assert.ok(keys[4].endsWith('|0') && keys[4].split('|')[1] !== keys[0].split('|')[1]) // depois, outros horários
})

check('buildPhases recusa datas dentro da antecedência mínima e datas inválidas', () => {
  assert.equal(buildPhases({ date: '2026-11-14', hour: 9, profile: 'equilibrado', nowWall: now }).ok, false)
  assert.equal(buildPhases({ date: 'x', hour: 9, profile: 'curto', nowWall: now }).ok, false)
})

check('alertas de prazo apertado refletem edições manuais', () => {
  const r = suggestSchedule({ year: 2026, month: 11, shift: 'manha', profile: 'curto', nowWall: now })
  assert.ok(r.ok)
  if (!r.ok) return
  const warns = scheduleWarnings(r.suggestion.phases, now).map((w) => w.code)
  assert.ok(warns.includes('inscricao-curta'))
  const edited = { ...r.suggestion.phases, pagamento: { inicio: '2026-11-18T00:00', fim: '2026-11-17T00:00' } }
  assert.ok(scheduleWarnings(edited, now).some((w) => w.code === 'cronologia'))
})

check('wallNow devolve o relógio de parede do fuso (sem deslocamento indevido)', () => {
  const utc = new Date('2026-11-10T02:30:00Z')
  assert.equal(new Date(wallNow('America/Sao_Paulo', utc)).getUTCDate(), 9) // ainda é dia 9 em São Paulo
  assert.equal(new Date(wallNow('America/Sao_Paulo', new Date('2026-11-10T15:00:00Z'))).getUTCHours(), 12)
  assert.equal(new Date(wallNow('Asia/Tokyo', utc)).getUTCHours(), 11)
})
