'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ChevronDown, Pause, Play, Plus, RotateCcw, Trophy, Undo2 } from 'lucide-react'

type DemoStepId = 'evento' | 'inscricoes' | 'chaves' | 'placar'

type DemoAthlete = {
  id: string
  name: string
  team: string
  belt: 'Branca' | 'Azul' | 'Roxa'
  weightKg: number
  category: string
}

type DemoLiveHistoryItem = {
  side: 'a' | 'b'
  kind: 'score' | 'advantage' | 'penalty'
  value: number
  label: string
}

const INITIAL_DEMO_ATHLETES: DemoAthlete[] = [
  { id: 'd1', name: 'Lucas Andrade (Fictício)', team: 'Academia Tatame Sul', belt: 'Branca', weightKg: 74.2, category: 'Adulto · M · Leve (até 76 kg)' },
  { id: 'd2', name: 'Rafael Monteiro (Fictício)', team: 'Equipe Horizonte BJJ', belt: 'Branca', weightKg: 75.5, category: 'Adulto · M · Leve (até 76 kg)' },
  { id: 'd3', name: 'Bruno Takahashi (Fictício)', team: 'Dojo Koma', belt: 'Branca', weightKg: 73.8, category: 'Adulto · M · Leve (até 76 kg)' },
  { id: 'd4', name: 'Diego Vasconcelos (Fictício)', team: 'Alliance Demo', belt: 'Branca', weightKg: 75.9, category: 'Adulto · M · Leve (até 76 kg)' },
]

function classifyDemoCategory(belt: string, weightKg: number): string {
  if (weightKg <= 64) return `Adulto · M · Pluma (${belt} · até 64 kg)`
  if (weightKg <= 70) return `Adulto · M · Pena (${belt} · até 70 kg)`
  if (weightKg <= 76) return `Adulto · M · Leve (${belt} · até 76 kg)`
  if (weightKg <= 82.3) return `Adulto · M · Médio (${belt} · até 82,3 kg)`
  if (weightKg <= 88.3) return `Adulto · M · Meio-Pesado (${belt} · até 88,3 kg)`
  return `Adulto · M · Pesado (${belt} · acima de 88,3 kg)`
}

function StageSelect({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string
  label: string
  value: string
  options: ReadonlyArray<{ value: string; label: string }>
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const current = options.find((option) => option.value === value)?.label ?? value

  useEffect(() => {
    if (!open) return
    function closeOnOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative text-left">
      <span id={`${id}-label`} className="block text-center font-mc-interface text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">
        {label}
      </span>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id}
        aria-labelledby={`${id}-label`}
        onClick={() => setOpen((currentOpen) => !currentOpen)}
        className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 border-0 border-b border-white/40 bg-transparent font-mc-interface text-base font-semibold text-white outline-none focus-visible:border-white"
      >
        {current}
        <ChevronDown aria-hidden="true" size={16} className={open ? 'rotate-180 transition-transform duration-200' : 'transition-transform duration-200'} />
      </button>
      {open ? (
        <ul id={id} role="listbox" aria-labelledby={`${id}-label`} className="absolute left-0 right-0 top-full z-30 mt-1 border border-mc-border bg-white py-1">
          {options.map((option) => {
            const selected = option.value === value
            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                  className={`flex min-h-11 w-full items-center px-3 text-left font-mc-interface text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mc-focus ${selected ? 'bg-mc-action text-white' : 'bg-white text-mc-text-primary hover:bg-mc-secondary-surface'}`}
                >
                  {option.label}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds)
  const m = Math.floor(safe / 60)
  const s = safe % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function InteractiveChampionshipDemo() {
  const [step, setStep] = useState<DemoStepId>('evento')

  // Step 1: Event state
  const [eventName, setEventName] = useState('Copa Demonstração MEU CAMP 2026')
  const [eventCity, setEventCity] = useState('Curitiba/PR')
  const [areasCount, setAreasCount] = useState('2')
  const [fightMinutes, setFightMinutes] = useState('5')

  // Step 2: Registrations state
  const [athletes, setAthletes] = useState<DemoAthlete[]>(INITIAL_DEMO_ATHLETES)
  const [newAthleteName, setNewAthleteName] = useState('')
  const [newAthleteTeam, setNewAthleteTeam] = useState('Equipe Visitante')
  const [newAthleteBelt, setNewAthleteBelt] = useState<'Branca' | 'Azul' | 'Roxa'>('Branca')
  const [newAthleteWeight, setNewAthleteWeight] = useState('74.5')
  const [registrationNotice, setRegistrationNotice] = useState<string | null>(null)

  // Step 3: Bracket state
  const [semi1WinnerIndex, setSemi1WinnerIndex] = useState<0 | 1>(0)
  const [semi2WinnerIndex, setSemi2WinnerIndex] = useState<2 | 3>(2)

  // Step 4: Live Scoreboard state
  const [scoreA, setScoreA] = useState(2)
  const [advA, setAdvA] = useState(1)
  const [penA, setPenA] = useState(0)
  const [scoreB, setScoreB] = useState(2)
  const [advB, setAdvB] = useState(0)
  const [penB, setPenB] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(5 * 60)
  const [clockRunning, setClockRunning] = useState(false)
  const [matchConfirmed, setMatchConfirmed] = useState(false)
  const [history, setHistory] = useState<DemoLiveHistoryItem[]>([
    { side: 'a', kind: 'score', value: 2, label: '+2 Lado A' },
    { side: 'b', kind: 'score', value: 2, label: '+2 Lado B' },
    { side: 'a', kind: 'advantage', value: 1, label: 'Vantagem Lado A' },
  ])

  useEffect(() => {
    setSecondsLeft(Number(fightMinutes || 5) * 60)
    setClockRunning(false)
  }, [fightMinutes])

  useEffect(() => {
    if (!clockRunning || matchConfirmed) return
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setClockRunning(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [clockRunning, matchConfirmed])

  const finalistA = athletes[semi1WinnerIndex] || INITIAL_DEMO_ATHLETES[0]
  const finalistB = athletes[semi2WinnerIndex] || INITIAL_DEMO_ATHLETES[2]

  function handleAddDemoAthlete(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = newAthleteName.trim()
    const weight = Number(newAthleteWeight.replace(',', '.'))
    if (trimmed.length < 3 || !Number.isFinite(weight) || weight < 20 || weight > 200) {
      setRegistrationNotice('Informe um nome com ao menos 3 letras e um peso válido (20 a 200 kg).')
      return
    }
    const category = classifyDemoCategory(newAthleteBelt, weight)
    const created: DemoAthlete = {
      id: `demo-${Date.now()}`,
      name: `${trimmed} (Fictício)`,
      team: newAthleteTeam.trim() || 'Equipe Independente',
      belt: newAthleteBelt,
      weightKg: Math.round(weight * 10) / 10,
      category,
    }
    setAthletes((prev) => [created, ...prev])
    setNewAthleteName('')
    setRegistrationNotice(`Atleta inscrito na demonstração e alocado em: ${category}.`)
  }

  function applyLiveDemoAction(side: 'a' | 'b', kind: 'score' | 'advantage' | 'penalty', value = 1) {
    if (matchConfirmed) return
    if (side === 'a') {
      if (kind === 'score') setScoreA((v) => v + value)
      if (kind === 'advantage') setAdvA((v) => v + 1)
      if (kind === 'penalty') setPenA((v) => v + 1)
    } else {
      if (kind === 'score') setScoreB((v) => v + value)
      if (kind === 'advantage') setAdvB((v) => v + 1)
      if (kind === 'penalty') setPenB((v) => v + 1)
    }
    const label =
      kind === 'score'
        ? `+${value} ${side === 'a' ? finalistA.name.split(' ')[0] : finalistB.name.split(' ')[0]}`
        : kind === 'advantage'
          ? `Vantagem ${side === 'a' ? 'A' : 'B'}`
          : `Penalidade ${side === 'a' ? 'A' : 'B'}`
    setHistory((prev) => [...prev, { side, kind, value, label }])
  }

  function undoLastLiveAction() {
    if (matchConfirmed || history.length === 0) return
    const last = history[history.length - 1]
    setHistory((prev) => prev.slice(0, -1))
    if (last.side === 'a') {
      if (last.kind === 'score') setScoreA((v) => Math.max(0, v - last.value))
      if (last.kind === 'advantage') setAdvA((v) => Math.max(0, v - 1))
      if (last.kind === 'penalty') setPenA((v) => Math.max(0, v - 1))
    } else {
      if (last.kind === 'score') setScoreB((v) => Math.max(0, v - last.value))
      if (last.kind === 'advantage') setAdvB((v) => Math.max(0, v - 1))
      if (last.kind === 'penalty') setPenB((v) => Math.max(0, v - 1))
    }
  }

  function resetDemo() {
    setEventName('Copa Demonstração MEU CAMP 2026')
    setEventCity('Curitiba/PR')
    setAreasCount('2')
    setFightMinutes('5')
    setAthletes(INITIAL_DEMO_ATHLETES)
    setNewAthleteName('')
    setRegistrationNotice(null)
    setSemi1WinnerIndex(0)
    setSemi2WinnerIndex(2)
    setScoreA(2)
    setAdvA(1)
    setPenA(0)
    setScoreB(2)
    setAdvB(0)
    setPenB(0)
    setSecondsLeft(5 * 60)
    setClockRunning(false)
    setMatchConfirmed(false)
    setHistory([
      { side: 'a', kind: 'score', value: 2, label: '+2 Lado A' },
      { side: 'b', kind: 'score', value: 2, label: '+2 Lado B' },
      { side: 'a', kind: 'advantage', value: 1, label: 'Vantagem Lado A' },
    ])
  }

  const leaderName =
    scoreA > scoreB
      ? finalistA.name
      : scoreB > scoreA
        ? finalistB.name
        : advA >= advB
          ? finalistA.name
          : finalistB.name

  const steps: ReadonlyArray<{ id: DemoStepId; number: string; label: string }> = [
    { id: 'evento', number: '1', label: 'Criar evento fictício' },
    { id: 'inscricoes', number: '2', label: 'Explorar inscrições' },
    { id: 'chaves', number: '3', label: 'Visualizar chaves' },
    { id: 'placar', number: '4', label: 'Operar placar LIVE' },
  ]
  const field = 'mt-2 min-h-12 w-full border-0 border-b border-mc-text-primary bg-transparent px-0 font-mc-interface text-base font-semibold text-mc-text-primary outline-none placeholder:font-normal placeholder:text-mc-text-secondary/70 focus:border-mc-action'
  const labelClass = 'block font-mc-interface text-[11px] font-bold uppercase tracking-[0.14em] text-mc-text-secondary'
  const solid = 'inline-flex min-h-12 items-center justify-center gap-2 bg-mc-text-primary px-5 font-mc-interface text-[11px] font-bold uppercase tracking-[0.14em] text-white transition-colors duration-200 hover:bg-mc-structure focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus disabled:cursor-not-allowed disabled:opacity-40'
  const line = 'inline-flex min-h-12 items-center justify-center gap-2 border border-mc-text-primary px-5 font-mc-interface text-[11px] font-bold uppercase tracking-[0.14em] text-mc-text-primary transition-colors duration-200 hover:bg-mc-text-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <section
      id="experimentar-demo"
      aria-labelledby="interactive-demo-title"
      data-no-scroll-choreography
      className="scroll-mt-20 border-t border-mc-border bg-mc-surface text-mc-text-primary"
    >
      <div className="mx-auto w-full max-w-7xl px-4 pb-8 pt-16 sm:px-8 sm:pt-20 lg:px-12 xl:px-20">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="font-mc-interface text-[11px] font-semibold uppercase tracking-[0.18em] text-mc-text-secondary">
              Demonstração · sem cadastro
            </p>
            <h2
              id="interactive-demo-title"
              className="mt-3 font-mc-display text-[clamp(2.5rem,5vw,4.5rem)] font-bold uppercase leading-[0.9] tracking-[-0.04em]"
            >
              Quatro passos.
              <span className="block">Nenhum cadastro.</span>
            </h2>
            <p className="mt-5 max-w-xl font-mc-interface text-base leading-7 text-mc-text-secondary">
              Experimente os 4 passos reais do MEU CAMP diretamente aqui. Tudo roda localmente no seu navegador com dados fictícios — sem exigir conta e sem gravar no banco.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={resetDemo} className={line}>
              <RotateCcw aria-hidden="true" size={14} />
              Reiniciar demonstração
            </button>
            <Link href="/login?mode=register&redirectTo=%2Fadmin%2Feventos%2Fnovo" className={solid}>
              Criar campeonato real
              <ArrowRight aria-hidden="true" size={14} />
            </Link>
          </div>
        </div>

        <div role="tablist" aria-label="Etapas da demonstração do campeonato" className="mt-10 flex gap-8 overflow-x-auto border-b border-mc-border">
          {steps.map((item) => {
            const active = step === item.id
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setStep(item.id)}
                className={`relative min-h-12 shrink-0 pb-3 font-mc-interface text-xs font-bold uppercase tracking-[0.12em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus ${active ? 'text-mc-text-primary' : 'text-mc-text-secondary hover:text-mc-text-primary'}`}
              >
                <span className="mr-2 font-mc-display text-base">{item.number}</span>
                {item.label}
                {active ? <span aria-hidden="true" className="absolute inset-x-0 -bottom-px h-0.5 bg-mc-action" /> : null}
              </button>
            )
          })}
        </div>
      </div>

      {step === 'evento' ? (
        <div role="tabpanel" aria-label="Criar evento fictício" className="relative min-h-[36rem] overflow-hidden bg-mc-nav-dark text-white lg:min-h-[42rem]">
          <Image src="/images/cinematic/bjj-2.jpg" alt="" fill priority sizes="100vw" className="object-cover object-center" />
          <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(var(--mc-nav-dark)/0.84),rgb(var(--mc-nav-dark)/0.28)_68%)]" />
          <div className="relative z-10 mx-auto flex min-h-[36rem] w-full max-w-5xl flex-col items-center justify-center px-6 py-16 text-center sm:px-10 lg:min-h-[42rem]">
            <p className="font-mc-interface text-[11px] font-semibold uppercase tracking-[0.22em] text-white/75">Simulação local · Jiu-Jitsu</p>
            <p data-testid="demo-event-banner-title" className="sr-only">{eventName || 'Campeonato sem nome'}</p>
            <label className="mt-5 w-full max-w-4xl">
              <span className="font-mc-interface text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">Nome do campeonato (demonstração)</span>
              <span className="mt-3 grid border-b border-white/40 focus-within:border-white">
                <span aria-hidden="true" className="invisible col-start-1 row-start-1 whitespace-pre-wrap px-0 pb-2 text-center font-mc-display text-[clamp(2.25rem,4.6vw,4.25rem)] font-bold uppercase leading-[0.92] tracking-[-0.04em]">
                  {eventName || 'Campeonato'}
                </span>
                <textarea
                  name="demo_event_name"
                  rows={1}
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="col-start-1 row-start-1 h-full w-full resize-none overflow-hidden border-0 bg-transparent p-0 text-center font-mc-display text-[clamp(2.25rem,4.6vw,4.25rem)] font-bold uppercase leading-[0.92] tracking-[-0.04em] text-white outline-none placeholder:text-white/35"
                />
              </span>
            </label>
            <div className="relative z-20 mt-8 grid w-full max-w-3xl gap-6 sm:grid-cols-3">
              <label className="block">
                <span className="font-mc-interface text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">Cidade / UF</span>
                <input name="demo_event_city" value={eventCity} onChange={(e) => setEventCity(e.target.value)} className="mt-2 w-full border-0 border-b border-white/40 bg-transparent px-0 text-center font-mc-interface text-base font-semibold text-white outline-none focus:border-white" />
              </label>
              <StageSelect
                id="demo-event-areas"
                label="Áreas (Tatames)"
                value={areasCount}
                onChange={setAreasCount}
                options={[
                  { value: '1', label: '1 área' },
                  { value: '2', label: '2 áreas' },
                  { value: '3', label: '3 áreas' },
                  { value: '4', label: '4 áreas' },
                ]}
              />
              <StageSelect
                id="demo-fight-minutes"
                label="Duração da luta"
                value={fightMinutes}
                onChange={setFightMinutes}
                options={[
                  { value: '3', label: '3 minutos' },
                  { value: '5', label: '5 minutos' },
                  { value: '6', label: '6 minutos' },
                  { value: '8', label: '8 minutos' },
                ]}
              />
            </div>
            <dl className="mt-10 grid grid-cols-3 gap-8 sm:gap-14">
              <div>
                <dt className="font-mc-interface text-[10px] font-semibold uppercase tracking-[0.16em] text-white/60">Tatames</dt>
                <dd className="mt-1 font-mc-display text-4xl font-bold leading-none sm:text-5xl">{areasCount}</dd>
              </div>
              <div>
                <dt className="font-mc-interface text-[10px] font-semibold uppercase tracking-[0.16em] text-white/60">Luta</dt>
                <dd className="mt-1 font-mc-display text-4xl font-bold leading-none sm:text-5xl">{fightMinutes}<span className="ml-1 font-mc-interface text-sm font-semibold">min</span></dd>
              </div>
              <div>
                <dt className="font-mc-interface text-[10px] font-semibold uppercase tracking-[0.16em] text-white/60">Atletas</dt>
                <dd className="mt-1 font-mc-display text-4xl font-bold leading-none text-mc-action sm:text-5xl">{athletes.length}</dd>
              </div>
            </dl>
            <button type="button" onClick={() => setStep('inscricoes')} className="mt-10 inline-flex min-h-12 w-full max-w-sm items-center justify-center gap-2 whitespace-nowrap bg-white px-4 font-mc-interface text-[11px] font-bold uppercase tracking-[0.08em] text-mc-text-primary transition-colors duration-200 hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-mc-nav-dark sm:w-auto sm:px-6 sm:text-xs sm:tracking-[0.14em]">
              Avançar para inscrições (Passo 2)
              <ArrowRight aria-hidden="true" size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div className="border-y border-white/10 bg-mc-nav-dark text-white">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-12 xl:px-20">
            <div className="min-w-0">
              <p className="font-mc-interface text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">Simulação local · Jiu-Jitsu</p>
              <p className="mt-2 truncate font-mc-display text-3xl font-bold uppercase leading-none tracking-[-0.03em] sm:text-4xl" data-testid="demo-event-banner-title">
                {eventName || 'Campeonato sem nome'}
              </p>
              <p className="mt-2 font-mc-interface text-sm text-white/75">{eventCity}</p>
            </div>
            <dl className="grid grid-cols-3 gap-6">
              <div>
                <dt className="font-mc-interface text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">Tatames</dt>
                <dd className="mt-1 font-mc-display text-3xl font-bold leading-none">{areasCount}</dd>
              </div>
              <div>
                <dt className="font-mc-interface text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">Luta</dt>
                <dd className="mt-1 font-mc-display text-3xl font-bold leading-none">{fightMinutes}<span className="ml-1 font-mc-interface text-sm font-semibold">min</span></dd>
              </div>
              <div>
                <dt className="font-mc-interface text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">Atletas</dt>
                <dd className="mt-1 font-mc-display text-3xl font-bold leading-none text-mc-action">{athletes.length}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {step === 'inscricoes' ? (
        <div role="tabpanel" aria-label="Explorar inscrições">
          <form onSubmit={handleAddDemoAthlete} className="border-b border-mc-text-primary">
            <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-8 lg:px-12 xl:px-20">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="font-mc-interface text-[11px] font-semibold uppercase tracking-[0.18em] text-mc-text-secondary">Checagem da demonstração</p>
                  <h3 className="mt-2 font-mc-display text-[clamp(2rem,4vw,3.25rem)] font-bold uppercase leading-[0.9] tracking-[-0.03em]">Inscreva um atleta</h3>
                </div>
                <p className="flex items-center font-mc-interface text-[11px] font-bold uppercase tracking-[0.14em] text-mc-text-primary">
                  <span aria-hidden="true" className="mr-2 inline-block h-2 w-2 bg-mc-success" />
                  Checagem aberta · {athletes.length}
                </p>
              </div>
              <p className="mt-3 max-w-xl font-mc-interface text-sm leading-6 text-mc-text-secondary">
                Adicione um atleta fictício e veja a categoria ser calculada pelo peso e pela faixa.
              </p>
              {registrationNotice ? (
                <p role="status" className="mt-5 border-l-4 border-mc-action py-1 pl-3 font-mc-interface text-sm font-semibold text-mc-text-primary">
                  {registrationNotice}
                </p>
              ) : null}
              <div className="mt-8 grid items-end gap-6 lg:grid-cols-[minmax(0,1.5fr)_9rem_8rem_minmax(0,1fr)_auto]">
                <label className={labelClass}>
                  Nome do atleta fictício
                  <input name="demo_athlete_name" placeholder="Ex.: Gabriel Silva" value={newAthleteName} onChange={(e) => setNewAthleteName(e.target.value)} className={`${field} font-mc-display text-2xl font-bold`} />
                </label>
                <label className={labelClass}>
                  Faixa
                  <select name="demo_athlete_belt" value={newAthleteBelt} onChange={(e) => setNewAthleteBelt(e.target.value as 'Branca' | 'Azul' | 'Roxa')} className={`${field} [color-scheme:light]`}>
                    <option value="Branca" className="bg-white text-mc-text-primary">Branca</option>
                    <option value="Azul" className="bg-white text-mc-text-primary">Azul</option>
                    <option value="Roxa" className="bg-white text-mc-text-primary">Roxa</option>
                  </select>
                </label>
                <label className={labelClass}>
                  Peso (kg)
                  <input name="demo_athlete_weight" type="number" step="0.1" min="20" max="200" value={newAthleteWeight} onChange={(e) => setNewAthleteWeight(e.target.value)} className={field} />
                </label>
                <label className={labelClass}>
                  Equipe
                  <input name="demo_athlete_team" value={newAthleteTeam} onChange={(e) => setNewAthleteTeam(e.target.value)} className={field} />
                </label>
                <button type="submit" className={solid}>
                  <Plus aria-hidden="true" size={14} />
                  Inscrever na demonstração
                </button>
              </div>
            </div>
          </form>
          <ul className="mx-auto w-full max-w-7xl px-4 sm:px-8 lg:px-12 xl:px-20">
            {athletes.map((athlete) => (
              <li key={athlete.id} className="grid items-center gap-4 border-b border-mc-border py-6 md:grid-cols-[8.5rem_minmax(0,1fr)_minmax(0,16rem)] md:gap-6">
                <div className="border-l-4 border-mc-action pl-3">
                  <p className="font-mc-display text-4xl font-bold leading-none tracking-[-0.04em]">{athlete.weightKg}</p>
                  <p className="mt-2 font-mc-interface text-[10px] font-semibold uppercase tracking-[0.12em] text-mc-text-secondary">kg · {athlete.belt}</p>
                </div>
                <div className="min-w-0">
                  <p className="truncate font-mc-display text-xl font-bold uppercase leading-tight tracking-[-0.02em] sm:text-2xl">{athlete.name}</p>
                  <p className="mt-1 font-mc-interface text-sm text-mc-text-secondary">{athlete.team}</p>
                </div>
                <p className="font-mc-interface text-[11px] font-bold uppercase tracking-[0.12em] text-mc-text-primary md:text-right">{athlete.category}</p>
              </li>
            ))}
          </ul>
          <div className="mx-auto flex w-full max-w-7xl justify-end px-4 py-8 sm:px-8 lg:px-12 xl:px-20">
            <button type="button" onClick={() => setStep('chaves')} className={line}>
              Ver chaves (Passo 3) →
            </button>
          </div>
        </div>
      ) : null}

      {step === 'chaves' ? (
        <div role="tabpanel" aria-label="Visualizar chaves">
          <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-8 lg:px-12 xl:px-20">
            <p className="font-mc-interface text-[11px] font-semibold uppercase tracking-[0.18em] text-mc-text-secondary">Adulto · Leve</p>
            <div className="mt-2 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <h3 className="font-mc-display text-[clamp(2rem,4vw,3.25rem)] font-bold uppercase leading-[0.9] tracking-[-0.03em]">Chave eliminatória</h3>
              <p className="max-w-sm font-mc-interface text-sm leading-6 text-mc-text-secondary">
                Clique em um atleta da semifinal para simular seu avanço à final.
              </p>
            </div>
            <div className="mt-10 divide-y divide-mc-border border-y border-mc-border">
              {([
                { label: '01', area: 'Área 1', indexes: [0, 1] as const, winner: semi1WinnerIndex as number, pick: (idx: number) => setSemi1WinnerIndex(idx as 0 | 1) },
                { label: '02', area: `Área ${Number(areasCount) > 1 ? '2' : '1'}`, indexes: [2, 3] as const, winner: semi2WinnerIndex as number, pick: (idx: number) => setSemi2WinnerIndex(idx as 2 | 3) },
              ]).map((bout) => (
                <div key={bout.label} className="grid items-center gap-4 py-6 md:grid-cols-[8.5rem_minmax(0,1fr)] md:gap-6">
                  <div className="border-l-4 border-mc-action pl-3">
                    <p className="font-mc-display text-4xl font-bold leading-none tracking-[-0.04em]">{bout.label}</p>
                    <p className="mt-2 font-mc-interface text-[10px] font-semibold uppercase tracking-[0.12em] text-mc-text-secondary">Semifinal · {bout.area}</p>
                  </div>
                  <div className="grid gap-px bg-mc-border sm:grid-cols-2">
                    {bout.indexes.map((idx) => {
                      const ath = athletes[idx] || INITIAL_DEMO_ATHLETES[idx]
                      const selected = bout.winner === idx
                      return (
                        <button
                          key={ath.id}
                          type="button"
                          onClick={() => bout.pick(idx)}
                          className={`flex min-h-16 items-center justify-between bg-mc-surface px-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus ${selected ? 'border-l-4 border-l-mc-action font-bold text-mc-text-primary' : 'text-mc-text-secondary hover:text-mc-text-primary'}`}
                        >
                          <span className="truncate font-mc-display text-lg uppercase">{ath.name}</span>
                          {selected ? <span className="ml-3 shrink-0 font-mc-interface text-[11px] font-bold uppercase tracking-[0.14em] text-mc-action">Avança</span> : null}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-mc-nav-dark text-white">
            <div className="mx-auto grid w-full max-w-7xl items-center gap-8 px-4 py-12 sm:px-8 lg:grid-cols-[8.5rem_minmax(0,1fr)_auto_minmax(0,1fr)] lg:px-12 xl:px-20">
              <div className="border-l-4 border-mc-action pl-3">
                <p className="font-mc-display text-4xl font-bold leading-none tracking-[-0.04em]">03</p>
                <p className="mt-2 font-mc-interface text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">Final · {fightMinutes} min</p>
              </div>
              <div>
                <p className="font-mc-interface text-[11px] font-bold uppercase tracking-[0.16em] text-white/50">Lado A</p>
                <p className="mt-2 font-mc-display text-3xl font-bold uppercase leading-[0.95] tracking-[-0.03em] sm:text-4xl">{finalistA.name}</p>
              </div>
              <p className="font-mc-display text-2xl font-bold text-white/40" aria-hidden="true">×</p>
              <div>
                <p className="font-mc-interface text-[11px] font-bold uppercase tracking-[0.16em] text-white/50">Lado B</p>
                <p className="mt-2 font-mc-display text-3xl font-bold uppercase leading-[0.95] tracking-[-0.03em] sm:text-4xl">{finalistB.name}</p>
              </div>
            </div>
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 pb-12 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12 xl:px-20">
              {matchConfirmed ? (
                <p className="flex items-center gap-2 font-mc-interface text-sm font-bold uppercase tracking-[0.08em]">
                  <Trophy aria-hidden="true" size={16} />
                  Campeão: {leaderName}
                </p>
              ) : (
                <p className="font-mc-interface text-sm text-white/70">Abra o passo 4 para pontuar e confirmar o campeão no placar.</p>
              )}
              <button type="button" onClick={() => setStep('placar')} className="inline-flex min-h-12 items-center justify-center gap-2 bg-white px-6 font-mc-interface text-xs font-bold uppercase tracking-[0.14em] text-mc-text-primary hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                Operar Final no Placar LIVE (Passo 4)
                <ArrowRight aria-hidden="true" size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {step === 'placar' ? (
        <div role="tabpanel" aria-label="Operar placar LIVE" className="bg-mc-nav-dark text-white">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-12 xl:px-20">
            <div>
              <p className="font-mc-interface text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">Área 1 · Luta 3 · Final demonstrativa</p>
              <h3 className="mt-2 font-mc-display text-3xl font-bold uppercase leading-[0.95] tracking-[-0.03em] sm:text-5xl">Adulto · Leve</h3>
              <p role="status" className="mt-4 font-mc-interface text-[11px] font-bold uppercase tracking-[0.16em] text-white">
                <span aria-hidden="true" className={`mr-2 inline-block h-2 w-2 ${matchConfirmed ? 'bg-mc-success' : 'bg-mc-action'}`} />
                {matchConfirmed ? 'Resultado confirmado' : 'Placar local pronto'}
              </p>
            </div>
            <div className="lg:text-right">
              <p className="font-mc-interface text-[11px] font-bold uppercase tracking-[0.16em] text-white/55">
                {matchConfirmed ? 'Luta encerrada' : clockRunning ? 'Cronômetro em andamento' : 'Cronômetro pausado'}
              </p>
              <p data-testid="demo-live-clock" className="font-mc-display text-7xl font-bold leading-none tabular-nums tracking-[-0.04em] sm:text-8xl">
                {formatClock(secondsLeft)}
              </p>
              <div className="mt-5 flex flex-wrap gap-3 lg:justify-end">
                <button type="button" disabled={matchConfirmed} onClick={() => setClockRunning((running) => !running)} className="inline-flex min-h-12 items-center gap-2 bg-white px-5 font-mc-interface text-[11px] font-bold uppercase tracking-[0.14em] text-mc-text-primary hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-40">
                  {clockRunning ? <Pause aria-hidden="true" size={15} /> : <Play aria-hidden="true" size={15} />}
                  {clockRunning ? 'Pausar' : 'Iniciar / Retomar'}
                </button>
                {!matchConfirmed ? (
                  <button type="button" onClick={() => { setClockRunning(false); setMatchConfirmed(true) }} className="inline-flex min-h-12 items-center gap-2 border border-white px-5 font-mc-interface text-[11px] font-bold uppercase tracking-[0.14em] text-white hover:bg-white hover:text-mc-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                    Confirmar resultado
                  </button>
                ) : (
                  <button type="button" onClick={() => setMatchConfirmed(false)} className="inline-flex min-h-12 items-center border border-white px-5 font-mc-interface text-[11px] font-bold uppercase tracking-[0.14em] text-white hover:bg-white hover:text-mc-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                    Reabrir placar demo
                  </button>
                )}
                <button type="button" onClick={undoLastLiveAction} disabled={matchConfirmed || history.length === 0} className="inline-flex min-h-12 items-center gap-2 px-2 font-mc-interface text-[11px] font-bold uppercase tracking-[0.14em] text-white/80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-40">
                  <Undo2 aria-hidden="true" size={14} />
                  Desfazer
                </button>
              </div>
            </div>
          </div>

          <div className="grid border-t border-white/15 md:grid-cols-2">
            <div className="border-b border-white/15 px-4 py-8 sm:px-8 md:border-b-0 md:border-r lg:px-12">
              <p className="font-mc-interface text-[11px] font-bold uppercase tracking-[0.16em] text-white/55">Lado A</p>
              <h4 className="mt-2 font-mc-display text-2xl font-bold uppercase leading-tight">{finalistA.name}</h4>
              <p className="mt-1 font-mc-interface text-sm text-white/60">{finalistA.team}</p>
              <p data-testid="demo-score-a" aria-label={`Pontos Lado A: ${scoreA}`} className="mt-4 font-mc-display text-8xl font-bold leading-none tabular-nums">{scoreA}</p>
              <p className="mt-3 font-mc-interface text-xs uppercase tracking-[0.12em] text-white/70">Vantagens {advA} · Penalidades <span className="text-mc-warning">{penA}</span></p>
              <div className="mt-6 flex flex-wrap gap-2">
                {[2, 3, 4].map((pts) => (
                  <button key={pts} type="button" disabled={matchConfirmed} aria-label={`Somar ${pts} pontos para Lado A`} onClick={() => applyLiveDemoAction('a', 'score', pts)} className="min-h-12 min-w-12 bg-white px-3 font-mc-display text-lg font-bold text-mc-text-primary hover:bg-mc-action hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-40">+{pts}</button>
                ))}
                <button type="button" disabled={matchConfirmed} onClick={() => applyLiveDemoAction('a', 'advantage', 1)} className="min-h-12 border border-white px-3 font-mc-interface text-[11px] font-bold uppercase tracking-[0.12em] hover:bg-white hover:text-mc-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-40">+Vantagem</button>
                <button type="button" disabled={matchConfirmed} onClick={() => applyLiveDemoAction('a', 'penalty', 1)} className="min-h-12 border border-mc-warning px-3 font-mc-interface text-[11px] font-bold uppercase tracking-[0.12em] text-mc-warning hover:bg-mc-warning hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-40">+Penalidade</button>
              </div>
            </div>
            <div className="bg-white px-4 py-8 text-mc-text-primary sm:px-8 lg:px-12">
              <p className="font-mc-interface text-[11px] font-bold uppercase tracking-[0.16em] text-mc-text-secondary">Lado B</p>
              <h4 className="mt-2 font-mc-display text-2xl font-bold uppercase leading-tight">{finalistB.name}</h4>
              <p className="mt-1 font-mc-interface text-sm text-mc-text-secondary">{finalistB.team}</p>
              <p data-testid="demo-score-b" aria-label={`Pontos Lado B: ${scoreB}`} className="mt-4 font-mc-display text-8xl font-bold leading-none tabular-nums">{scoreB}</p>
              <p className="mt-3 font-mc-interface text-xs uppercase tracking-[0.12em] text-mc-text-secondary">Vantagens {advB} · Penalidades <span className="text-mc-warning">{penB}</span></p>
              <div className="mt-6 flex flex-wrap gap-2">
                {[2, 3, 4].map((pts) => (
                  <button key={pts} type="button" disabled={matchConfirmed} aria-label={`Somar ${pts} pontos para Lado B`} onClick={() => applyLiveDemoAction('b', 'score', pts)} className="min-h-12 min-w-12 bg-mc-text-primary px-3 font-mc-display text-lg font-bold text-white hover:bg-mc-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus disabled:opacity-40">+{pts}</button>
                ))}
                <button type="button" disabled={matchConfirmed} onClick={() => applyLiveDemoAction('b', 'advantage', 1)} className="min-h-12 border border-mc-text-primary px-3 font-mc-interface text-[11px] font-bold uppercase tracking-[0.12em] hover:bg-mc-text-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus disabled:opacity-40">+Vantagem</button>
                <button type="button" disabled={matchConfirmed} onClick={() => applyLiveDemoAction('b', 'penalty', 1)} className="min-h-12 border border-mc-warning px-3 font-mc-interface text-[11px] font-bold uppercase tracking-[0.12em] text-mc-warning hover:bg-mc-warning hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus disabled:opacity-40">+Penalidade</button>
              </div>
            </div>
          </div>
          {matchConfirmed ? (
            <p role="status" className="border-t border-white/15 px-4 py-5 text-center font-mc-display text-2xl font-bold uppercase tracking-[-0.03em] sm:px-8">
              Vencedor: {leaderName} · {scoreA} × {scoreB}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
