/**
 * Gerador de datas das fases do evento (inscrição, pagamento, checagem, chaves) a partir da data do campeonato e do turno.
 * Tudo em "relógio de parede" do fuso do evento: os valores devolvidos servem direto para <input type="datetime-local">.
 * Puro e testável; o organizador pode editar qualquer campo depois.
 */

export type EventShift = 'manha' | 'tarde' | 'noite'

/** Hora de início do turno e rótulo. */
export const SHIFTS: Record<EventShift, { label: string; startHour: number }> = {
  manha: { label: 'Manhã', startHour: 8 },
  tarde: { label: 'Tarde', startHour: 13 },
  noite: { label: 'Noite', startHour: 18 },
}

export type GeneratedPhases = Record<'inscricao' | 'pagamento' | 'checagem' | 'chaves', { inicio: string; fim: string }>
export type PhaseGenerationResult = { ok: true; phases: GeneratedPhases } | { ok: false; message: string }

const pad = (value: number) => String(value).padStart(2, '0')
const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** "AAAA-MM-DD" + hora → ms em "UTC fictício" (relógio de parede). */
function wall(date: string, hour = 0, minute = 0) {
  const [year, month, day] = date.split('-').map(Number)
  return Date.UTC(year, month - 1, day, hour, minute)
}

export function formatLocalInput(ms: number) {
  const d = new Date(ms)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
}

/** Agora no relógio de parede do fuso informado (mesma convenção de `wall`). */
export function wallNow(timeZone: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  }).formatToParts(now)
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value)
  return Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'))
}

/**
 * Linha do tempo (da data do evento D e da hora H de início do turno):
 *  - Inscrição: de D-30 09:00 até D-7 23:59
 *  - Pagamento: de D-6 00:00 até D-3 23:59
 *  - Checagem:  de D-2 00:00 até D-1 12:00
 *  - Chaves:    de D-1 12:00 até H-2h do dia D
 * Se a data estiver próxima, o início de cada fase é empurrado para "agora" (arredondado para a próxima hora cheia)
 * e as fases seguintes são comprimidas; se não couber, devolve erro e o organizador preenche à mão.
 */
export function generatePhases(eventDate: string, shift: EventShift, nowWall: number): PhaseGenerationResult {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) return { ok: false, message: 'Informe a data do evento antes de gerar as fases.' }
  const dayStart = wall(eventDate)
  const chavesEnd = dayStart + (SHIFTS[shift].startHour - 2) * HOUR
  const floor = Math.ceil(nowWall / HOUR) * HOUR
  if (floor >= chavesEnd - 4 * HOUR) {
    return { ok: false, message: 'A data do evento está muito próxima para gerar as fases automaticamente. Preencha manualmente.' }
  }

  const ideal = {
    inscricao: [dayStart - 30 * DAY + 9 * HOUR, dayStart - 7 * DAY + 23 * HOUR + 59 * MINUTE],
    pagamento: [dayStart - 6 * DAY, dayStart - 3 * DAY + 23 * HOUR + 59 * MINUTE],
    checagem: [dayStart - 2 * DAY, dayStart - DAY + 12 * HOUR],
    chaves: [dayStart - DAY + 12 * HOUR, chavesEnd],
  } as const

  const names = ['inscricao', 'pagamento', 'checagem', 'chaves'] as const
  const phases = {} as GeneratedPhases
  let cursor = floor
  for (const name of names) {
    let [start, end] = ideal[name]
    start = Math.max(start, cursor)
    if (end <= start) end = start + 2 * HOUR
    if (end > chavesEnd) end = chavesEnd
    if (end <= start) return { ok: false, message: 'Não foi possível encaixar as fases até a data do evento. Preencha manualmente.' }
    phases[name] = { inicio: formatLocalInput(start), fim: formatLocalInput(end) }
    cursor = end
  }
  return { ok: true, phases }
}

const pad2 = (value: number) => String(value).padStart(2, '0')

/**
 * Escolhe o dia do evento dentro do mês/ano: o primeiro sábado em que as fases cabem (campeonatos de jiu-jitsu
 * costumam ser aos sábados). Sem sábado possível, tenta o primeiro domingo; sem nenhum, devolve erro.
 */
export function pickEventDate(year: number, month: number, shift: EventShift, nowWall: number): { ok: true; date: string; phases: GeneratedPhases } | { ok: false; message: string } {
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate()
  for (const weekday of [6, 0]) {
    for (let day = 1; day <= last; day += 1) {
      if (new Date(Date.UTC(year, month - 1, day)).getUTCDay() !== weekday) continue
      const date = `${year}-${pad2(month)}-${pad2(day)}`
      const result = generatePhases(date, shift, nowWall)
      if (result.ok) return { ok: true, date, phases: result.phases }
    }
  }
  return { ok: false, message: 'Nesse mês não há fim de semana com tempo suficiente para as fases. Escolha um mês mais à frente.' }
}
