'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import {
  PHASE_KEYS,
  PHASE_LABELS,
  PROFILES,
  SHIFTS,
  daysBetween,
  scheduleWarnings,
  suggestSchedule,
  wallNow,
  type EventShift,
  type GeneratedPhases,
  type RegistrationProfile,
} from '@/lib/events/phase-generator'

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const TRACKED = new Set(['data_evento', ...PHASE_KEYS.flatMap((key) => [`${key}_inicio`, `${key}_fim`])])

const emptyPhases = (): GeneratedPhases => ({
  inscricao: { inicio: '', fim: '' }, pagamento: { inicio: '', fim: '' }, checagem: { inicio: '', fim: '' }, chaves: { inicio: '', fim: '' },
})

function readForm(form: HTMLFormElement) {
  const data = new FormData(form)
  const text = (name: string) => String(data.get(name) || '')
  const phases = emptyPhases()
  for (const key of PHASE_KEYS) phases[key] = { inicio: text(`${key}_inicio`), fim: text(`${key}_fim`) }
  return { date: text('data_evento'), timezone: text('timezone') || 'America/Sao_Paulo', phases }
}

function fieldSetter(form: HTMLFormElement) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  return (name: string, value: string) => {
    const input = form.elements.namedItem(name)
    if (input instanceof HTMLInputElement) {
      setter?.call(input, value)
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }
}

const shortDate = (value: string) => (value ? `${value.slice(8, 10)}/${value.slice(5, 7)} ${value.slice(11, 16)}` : '—')
const hourLabel = (hour: number) => `${String(hour).padStart(2, '0')}h`
function longDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  const [y, m, d] = date.split('-').map(Number)
  const text = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d, 12)))
  return text.replace(/^./, (c) => c.toUpperCase())
}

type Notice = { tone: 'ok' | 'error' | 'info'; text: string } | null

/**
 * Gerador de evento: mês/ano + período + prazo de inscrições → data (primeiro sábado viável) e as quatro fases oficiais.
 * Só preenche os campos do formulário (nada é gravado até o organizador salvar) e pede consentimento antes de
 * sobrescrever datas editadas à mão. A lógica de cálculo vive em lib/events/phase-generator.ts.
 */
export function EventScheduleGenerator({ onGenerated }: { onGenerated?: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const manualRef = useRef(false)
  const fillingRef = useRef(false)
  const seenRef = useRef<Set<string>>(new Set())
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [shift, setShift] = useState<EventShift>('manha')
  const [profile, setProfile] = useState<RegistrationProfile>('equilibrado')
  const [hour, setHour] = useState<number | null>(null)
  const [generatedOnce, setGeneratedOnce] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)
  const [alternative, setAlternative] = useState<{ year: number; month: number } | null>(null)
  const [pendingOverwrite, setPendingOverwrite] = useState<{ again: boolean } | null>(null)
  const [snapshot, setSnapshot] = useState<{ date: string; phases: GeneratedPhases; timezone: string } | null>(null)

  const form = () => rootRef.current?.closest('form') ?? null

  // Acompanha o formulário: o resumo reflete também as edições manuais; edição real (isTrusted) marca "manual".
  useEffect(() => {
    const target = form()
    if (!target) return
    const sync = () => setSnapshot(readForm(target))
    const onInput = (event: Event) => {
      const name = (event.target as HTMLInputElement | null)?.name
      if (!fillingRef.current && name && TRACKED.has(name)) manualRef.current = true
      sync()
    }
    sync()
    target.addEventListener('input', onInput)
    return () => target.removeEventListener('input', onInput)
  }, [])

  const resetSeen = () => { seenRef.current = new Set(); setGeneratedOnce(false); setAlternative(null); setNotice(null) }

  const hasValues = (values: ReturnType<typeof readForm>) => Boolean(values.date || PHASE_KEYS.some((key) => values.phases[key].inicio || values.phases[key].fim))

  const run = useCallback((again: boolean, overrides?: { year: number; month: number }) => {
    const target = form()
    if (!target) return
    const values = readForm(target)
    const useYear = overrides?.year ?? year
    const useMonth = overrides?.month ?? month
    const result = suggestSchedule({ year: useYear, month: useMonth, shift, profile, nowWall: wallNow(values.timezone), seen: seenRef.current })
    if (!result.ok) {
      if (result.reason === 'sem-data') {
        setNotice({ tone: 'error', text: result.message })
        setAlternative(result.alternative)
      } else {
        setNotice({ tone: 'info', text: result.message })
        setAlternative(null)
      }
      return
    }
    const { suggestion } = result
    seenRef.current.add(suggestion.key)
    const set = fieldSetter(target)
    fillingRef.current = true // os eventos disparados aqui não contam como edição manual
    try {
      set('data_evento', suggestion.date)
      for (const key of PHASE_KEYS) {
        set(`${key}_inicio`, suggestion.phases[key].inicio)
        set(`${key}_fim`, suggestion.phases[key].fim)
      }
    } finally {
      fillingRef.current = false
    }
    manualRef.current = false
    setHour(suggestion.hour)
    setGeneratedOnce(true)
    setAlternative(null)
    setPendingOverwrite(null)
    setNotice({ tone: 'ok', text: again ? 'Nova sugestão aplicada. Revise e ajuste o que precisar.' : 'Sugestão aplicada. Revise e ajuste o que precisar.' })
    onGenerated?.()
  }, [year, month, shift, profile, onGenerated])

  const request = (again: boolean, overrides?: { year: number; month: number }) => {
    const target = form()
    if (!target) return
    // Datas editadas à mão nunca são sobrescritas sem consentimento explícito.
    if (manualRef.current && hasValues(readForm(target))) {
      setPendingOverwrite({ again })
      return
    }
    run(again, overrides)
  }

  const warnings = snapshot && hasValues(snapshot) && PHASE_KEYS.every((key) => snapshot.phases[key].inicio && snapshot.phases[key].fim)
    ? scheduleWarnings(snapshot.phases, wallNow(snapshot.timezone))
    : []
  const dateText = snapshot ? longDate(snapshot.date) : null
  const years = [now.getFullYear(), now.getFullYear() + 1, now.getFullYear() + 2]
  const chip = (active: boolean) =>
    `rounded-mc-medium border px-4 py-2.5 text-left font-mc-interface text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus ${
      active ? 'border-mc-action bg-mc-action/10 text-mc-text-primary' : 'border-mc-border bg-mc-surface text-mc-text-secondary hover:border-mc-text-secondary'
    }`

  return (
    <div ref={rootRef} className="mt-4 rounded-mc-medium bg-mc-surface-secondary p-4 sm:p-5">
      <h3 className="font-mc-interface text-base font-semibold text-mc-text-primary">Gerar evento automaticamente</h3>
      <p className="mt-1 max-w-2xl font-mc-interface text-sm text-mc-text-secondary">
        Escolha quando deseja realizar seu campeonato. Sugerimos a melhor data disponível e organizamos automaticamente as etapas de preparação.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="block min-w-40 space-y-1.5 font-mc-interface text-sm font-semibold text-mc-text-primary">
          Mês
          <Select value={month} onChange={(event) => { setMonth(Number(event.target.value)); resetSeen() }}>
            {MONTHS.map((label, index) => <option key={label} value={index + 1}>{label}</option>)}
          </Select>
        </label>
        <label className="block w-32 space-y-1.5 font-mc-interface text-sm font-semibold text-mc-text-primary">
          Ano
          <Select value={year} onChange={(event) => { setYear(Number(event.target.value)); resetSeen() }}>
            {years.map((value) => <option key={value} value={value}>{value}</option>)}
          </Select>
        </label>
      </div>

      <fieldset className="mt-4">
        <legend className="font-mc-interface text-sm font-semibold text-mc-text-primary">Período do campeonato</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {(Object.keys(SHIFTS) as EventShift[]).map((key) => (
            <button key={key} type="button" aria-pressed={shift === key} onClick={() => { setShift(key); resetSeen() }} className={chip(shift === key)}>
              <span className="block font-semibold">{SHIFTS[key].label}</span>
              <span className="block text-xs">início às {hourLabel(SHIFTS[key].hours[0])}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-4">
        <legend className="font-mc-interface text-sm font-semibold text-mc-text-primary">Prazo de inscrições</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {(Object.keys(PROFILES) as RegistrationProfile[]).map((key) => (
            <button key={key} type="button" aria-pressed={profile === key} onClick={() => { setProfile(key); resetSeen() }} className={chip(profile === key)}>
              <span className="block font-semibold">{PROFILES[key].label}{key === 'equilibrado' ? ' · recomendado' : ''}</span>
              <span className="mt-0.5 block text-xs">{PROFILES[key].description}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-4 flex flex-wrap gap-3">
        <Button type="button" onClick={() => request(false)}>Gerar sugestão</Button>
        {generatedOnce ? <Button type="button" variant="outline" onClick={() => request(true)}>Gerar outra sugestão</Button> : null}
      </div>

      {pendingOverwrite ? (
        <div role="alertdialog" aria-label="Substituir datas editadas" className="mt-3 rounded-mc-medium border border-mc-warning/50 bg-mc-surface p-3 font-mc-interface text-sm text-mc-text-primary">
          <p>Você editou datas manualmente. Quer substituí-las pela sugestão?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button type="button" onClick={() => run(pendingOverwrite.again)}>Substituir minhas datas</Button>
            <Button type="button" variant="outline" onClick={() => setPendingOverwrite(null)}>Manter minhas datas</Button>
          </div>
        </div>
      ) : null}

      {notice ? (
        <p role="status" className={`mt-3 font-mc-interface text-sm ${notice.tone === 'ok' ? 'text-mc-success' : notice.tone === 'error' ? 'text-mc-error' : 'text-mc-text-secondary'}`}>
          {notice.text}
        </p>
      ) : null}
      {alternative ? (
        <div className="mt-2">
          <Button type="button" variant="outline" onClick={() => { setMonth(alternative.month); setYear(alternative.year); resetSeen(); request(false, alternative) }}>
            Usar {MONTHS[alternative.month - 1]} de {alternative.year}
          </Button>
        </div>
      ) : null}

      {dateText && snapshot ? (
        <section aria-label="Resumo do cronograma" className="mt-5 rounded-mc-medium border border-mc-border bg-mc-surface p-4">
          <p className="font-mc-interface text-xs font-semibold uppercase tracking-[0.14em] text-mc-text-secondary">Campeonato</p>
          <p className="mt-1 font-mc-display text-xl font-semibold text-mc-text-primary first-letter:uppercase">
            {dateText}{hour !== null ? ` · ${hourLabel(hour)}` : ''}
          </p>
          <ol className="mt-4 grid gap-2 sm:grid-cols-4">
            {PHASE_KEYS.map((key) => {
              const { inicio, fim } = snapshot.phases[key]
              const filled = inicio && fim
              return (
                <li key={key} className="rounded-mc-small border border-mc-border p-3 font-mc-interface text-sm">
                  <span className="block font-semibold text-mc-text-primary">{PHASE_LABELS[key]}</span>
                  <span className="mt-1 block text-mc-text-secondary">{shortDate(inicio)}</span>
                  <span className="block text-mc-text-secondary">até {shortDate(fim)}</span>
                  {filled ? <span className="mt-1 block text-xs text-mc-text-secondary">{Math.max(1, daysBetween(inicio, fim))} dia(s)</span> : null}
                </li>
              )
            })}
          </ol>
          {snapshot.phases.chaves.fim && snapshot.phases.inscricao.fim ? (
            <p className="mt-3 font-mc-interface text-xs text-mc-text-secondary">
              Inscrições encerram {Math.max(0, daysBetween(snapshot.phases.inscricao.fim, `${snapshot.date}T00:00`))} dia(s) antes do campeonato. Edite qualquer data ou horário nos campos abaixo.
            </p>
          ) : null}
          {warnings.length > 0 ? (
            <ul className="mt-3 space-y-1 font-mc-interface text-sm text-mc-warning" role="status">
              {warnings.map((warning) => <li key={warning.code}>⚠ {warning.message}</li>)}
            </ul>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
