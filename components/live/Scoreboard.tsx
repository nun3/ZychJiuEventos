'use client'

import type { LiveSessionPayload } from '@/app/admin/eventos/[id]/operacao/types'
import type { OperatorAthlete } from '@/app/admin/eventos/[id]/operacao/types'

function SidePanel({
  label,
  athlete,
  score,
  advantages,
  penalties,
  highlight,
}: {
  label: string
  athlete: OperatorAthlete | null
  score: number
  advantages: number
  penalties: number
  highlight: boolean
}) {
  return (
    <div className={`rounded-3xl bg-black/30 p-4 ring-1 ring-white/10 sm:p-5 ${highlight ? 'ring-2 ring-mc-action shadow-[0_0_0_1px_rgba(37,99,235,0.35)]' : ''}`}>
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-1 truncate font-mc-display text-lg font-bold uppercase leading-tight text-white sm:text-xl">
        {athlete?.name || 'A definir'}
      </p>
      {athlete?.team ? <p className="mt-0.5 truncate text-sm text-slate-300">{athlete.team}</p> : null}
      <p className="mt-3 font-mc-display text-5xl font-bold tabular-nums leading-none sm:text-6xl" aria-label={`Pontos ${score}`}>
        {score}
      </p>
      <div className="mt-3 flex gap-4 text-sm font-semibold text-slate-200">
        <span aria-label={`Vantagens ${advantages}`}>Vant. {advantages}</span>
        <span aria-label={`Penalidades ${penalties}`}>Pen. {penalties}</span>
      </div>
    </div>
  )
}

export function Scoreboard({
  session,
  sideA,
  sideB,
  flash,
}: {
  session: LiveSessionPayload
  sideA: OperatorAthlete | null
  sideB: OperatorAthlete | null
  flash: boolean
}) {
  return (
    <div className={`grid gap-3 transition-[box-shadow] duration-mc-normal motion-reduce:transition-none sm:grid-cols-2 sm:gap-4 ${flash ? 'shadow-[0_0_0_2px_rgba(37,99,235,0.55)]' : ''}`}>
      <SidePanel
        label="Lado A"
        athlete={sideA}
        score={session.scoreA}
        advantages={session.advantagesA}
        penalties={session.penaltiesA}
        highlight={flash}
      />
      <SidePanel
        label="Lado B"
        athlete={sideB}
        score={session.scoreB}
        advantages={session.advantagesB}
        penalties={session.penaltiesB}
        highlight={flash}
      />
    </div>
  )
}
