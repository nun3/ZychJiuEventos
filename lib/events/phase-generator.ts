/**
 * Gerador determinístico de cronograma de evento (sem IA, sem aleatoriedade).
 *
 * Fases oficiais (event_phases): inscricao -> pagamento -> checagem -> chaves, em ordem e sem sobreposição.
 * Tudo em "relógio de parede" do fuso do evento: os textos devolvidos servem direto para <input type="datetime-local">
 * (o servidor converte para UTC com o fuso escolhido).
 *
 * Linha do tempo, de trás para frente, a partir do dia D e do horário T do campeonato:
 *   chaves    D-1 12:00 -> T-2h
 *   checagem  D-N 00:00 -> D-1 12:00           (N do perfil)
 *   pagamento P dias, terminando na véspera do início da checagem
 *   inscrição abre na antecedência preferida (ou "agora", se já estiver dentro dela) e fecha na véspera do pagamento
 */
import {
  MIN_REGISTRATION_HOURS,
  PROFILES,
  SHIFTS,
  WARN_PAYMENT_DAYS,
  WARN_REGISTRATION_DAYS,
  type EventShift,
  type RegistrationProfile,
} from './schedule-config'

export { SHIFTS, PROFILES }
export type { EventShift, RegistrationProfile }

export type PhaseKey = 'inscricao' | 'pagamento' | 'checagem' | 'chaves'
export const PHASE_KEYS: readonly PhaseKey[] = ['inscricao', 'pagamento', 'checagem', 'chaves']
export const PHASE_LABELS: Record<PhaseKey, string> = { inscricao: 'Inscrição', pagamento: 'Pagamento', checagem: 'Checagem', chaves: 'Chaves' }
export type GeneratedPhases = Record<PhaseKey, { inicio: string; fim: string }>

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const pad = (value: number) => String(value).padStart(2, '0')

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

export type TailVariant = 0 | 1 | 2 // 0 = padrão do perfil; 1 = pagamento +1 dia; 2 = pagamento -1 dia

export interface BuildInput {
  date: string
  hour: number
  profile: RegistrationProfile
  tail?: TailVariant
  nowWall: number
}
export type BuildResult = { ok: true; phases: GeneratedPhases } | { ok: false; reason: string }

/** Monta as quatro fases de uma combinação (data, horário, perfil, variação). Falha se o calendário não for válido. */
export function buildPhases({ date, hour, profile, tail = 0, nowWall }: BuildInput): BuildResult {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, reason: 'Data inválida.' }
  const config = PROFILES[profile]
  const d0 = wall(date)
  const start = d0 + hour * HOUR
  const today = Math.floor(nowWall / DAY) * DAY
  if (Math.round((d0 - today) / DAY) < config.minLeadDays) {
    return { ok: false, reason: `O perfil ${config.label.toLowerCase()} pede pelo menos ${config.minLeadDays} dias de antecedência.` }
  }
  const payDays = Math.max(2, config.paymentDays + (tail === 1 ? 1 : tail === 2 ? -1 : 0))

  const chaves: [number, number] = [d0 - DAY + 12 * HOUR, start - 2 * HOUR]
  const checagem: [number, number] = [d0 - config.checagemDaysBefore * DAY, d0 - DAY + 12 * HOUR]
  const pagamentoEnd = checagem[0] - MINUTE // véspera, 23:59
  const pagamento: [number, number] = [checagem[0] - payDays * DAY, pagamentoEnd]
  const inscricaoEnd = pagamento[0] - MINUTE
  const idealOpen = d0 - config.preferredLeadDays[1] * DAY + 9 * HOUR
  const inscricaoStart = Math.max(idealOpen, Math.ceil(nowWall / HOUR) * HOUR)
  const inscricao: [number, number] = [inscricaoStart, inscricaoEnd]

  if (inscricao[1] - inscricao[0] < MIN_REGISTRATION_HOURS * HOUR) {
    return { ok: false, reason: 'Não há tempo suficiente para as inscrições antes das demais etapas.' }
  }
  const phases = { inscricao, pagamento, checagem, chaves }
  const out = {} as GeneratedPhases
  for (const key of PHASE_KEYS) out[key] = { inicio: formatLocalInput(phases[key][0]), fim: formatLocalInput(phases[key][1]) }
  const problem = validatePhases(out)
  return problem ? { ok: false, reason: problem } : { ok: true, phases: out }
}

/** Mesmas regras do servidor (createEvent): início < fim e fases em ordem, sem sobreposição. */
export function validatePhases(phases: GeneratedPhases): string | null {
  let previousEnd = ''
  for (const key of PHASE_KEYS) {
    const { inicio, fim } = phases[key]
    if (!inicio || !fim || inicio >= fim) return 'Cada fase deve possuir início anterior ao término.'
    if (previousEnd && inicio < previousEnd) return 'As fases devem estar em ordem e não podem se sobrepor.'
    previousEnd = fim
  }
  return null
}

/** Sábados (AAAA-MM-DD) do mês, em ordem. `month` é 1–12. */
export function saturdaysOfMonth(year: number, month: number): string[] {
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const result: string[] = []
  for (let day = 1; day <= last; day += 1) {
    if (new Date(Date.UTC(year, month - 1, day)).getUTCDay() === 6) result.push(`${year}-${pad(month)}-${pad(day)}`)
  }
  return result
}

interface Candidate { key: string; date: string; hour: number; tail: TailVariant }

/**
 * Ordem das sugestões: (1) cada sábado no horário padrão; (2) cada sábado nos horários alternativos do turno;
 * (3) cada sábado com o pagamento mais longo/curto. A primeira sugestão é sempre o primeiro sábado viável.
 */
export function candidatesFor(year: number, month: number, shift: EventShift): Candidate[] {
  const saturdays = saturdaysOfMonth(year, month)
  const hours = SHIFTS[shift].hours
  const list: Candidate[] = []
  const add = (date: string, hour: number, tail: TailVariant) => list.push({ key: `${date}|${hour}|${tail}`, date, hour, tail })
  for (const date of saturdays) add(date, hours[0], 0)
  for (const alt of hours.slice(1)) for (const date of saturdays) add(date, alt, 0)
  for (const tail of [1, 2] as const) for (const date of saturdays) add(date, hours[0], tail)
  return list
}

export interface Suggestion {
  key: string
  date: string
  weekday: string
  hour: number
  shift: EventShift
  profile: RegistrationProfile
  phases: GeneratedPhases
}

export type SuggestResult =
  | { ok: true; suggestion: Suggestion }
  | { ok: false; reason: 'sem-data'; message: string; alternative: { year: number; month: number } | null }
  | { ok: false; reason: 'esgotado'; message: string }

export interface SuggestInput {
  year: number
  month: number
  shift: EventShift
  profile: RegistrationProfile
  nowWall: number
  /** Chaves de sugestões já apresentadas nesta interação. */
  seen?: ReadonlySet<string>
}

function viable(input: SuggestInput, candidate: Candidate): Suggestion | null {
  const built = buildPhases({ date: candidate.date, hour: candidate.hour, profile: input.profile, tail: candidate.tail, nowWall: input.nowWall })
  if (!built.ok) return null
  return { key: candidate.key, date: candidate.date, weekday: 'sábado', hour: candidate.hour, shift: input.shift, profile: input.profile, phases: built.phases }
}

/** Próxima sugestão válida ainda não apresentada. Nunca muda de mês em silêncio: oferece o mês seguinte viável. */
export function suggestSchedule(input: SuggestInput): SuggestResult {
  const all = candidatesFor(input.year, input.month, input.shift)
  const viableAll = all.map((candidate) => viable(input, candidate)).filter((item): item is Suggestion => item !== null)
  if (viableAll.length === 0) {
    for (let step = 1; step <= 18; step += 1) {
      const index = input.month - 1 + step
      const year = input.year + Math.floor(index / 12)
      const month = (index % 12) + 1
      if (candidatesFor(year, month, input.shift).some((candidate) => viable({ ...input, year, month }, candidate))) {
        return { ok: false, reason: 'sem-data', message: 'Nenhum sábado deste mês permite cumprir as etapas desse perfil de inscrições.', alternative: { year, month } }
      }
    }
    return { ok: false, reason: 'sem-data', message: 'Nenhum sábado deste mês permite cumprir as etapas desse perfil de inscrições.', alternative: null }
  }
  const next = viableAll.find((item) => !input.seen?.has(item.key))
  if (!next) return { ok: false, reason: 'esgotado', message: 'Não há outras sugestões válidas para este mês, turno e perfil.' }
  return { ok: true, suggestion: next }
}

export interface ScheduleWarning { code: string; message: string }

/** Alertas de prazo apertado sobre os valores atuais (inclui edições manuais). */
export function scheduleWarnings(phases: GeneratedPhases, nowWall: number): ScheduleWarning[] {
  const warnings: ScheduleWarning[] = []
  const days = (a: string, b: string) => (Date.parse(`${b}:00Z`) - Date.parse(`${a}:00Z`)) / DAY
  if (phases.inscricao.inicio && phases.inscricao.fim) {
    const reg = days(phases.inscricao.inicio, phases.inscricao.fim)
    if (reg < WARN_REGISTRATION_DAYS) warnings.push({ code: 'inscricao-curta', message: `Inscrições abertas por apenas ${Math.max(0, Math.round(reg))} dia(s): pouco tempo de divulgação.` })
  }
  if (phases.pagamento.inicio && phases.pagamento.fim) {
    const pay = days(phases.pagamento.inicio, phases.pagamento.fim)
    if (pay < WARN_PAYMENT_DAYS) warnings.push({ code: 'pagamento-curto', message: 'Janela de pagamento menor que 2 dias.' })
  }
  if (phases.inscricao.inicio && Date.parse(`${phases.inscricao.inicio}:00Z`) < nowWall) {
    warnings.push({ code: 'inicio-passado', message: 'A abertura das inscrições está no passado.' })
  }
  const problem = PHASE_KEYS.every((key) => phases[key].inicio && phases[key].fim) ? validatePhases(phases) : null
  if (problem) warnings.push({ code: 'cronologia', message: problem })
  return warnings
}

/** Dias inteiros entre dois valores datetime-local (para o resumo). */
export function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(`${b}:00Z`) - Date.parse(`${a}:00Z`)) / DAY)
}
