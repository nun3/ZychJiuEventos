'use client'

import { useState } from 'react'
import type { LiveResultType, LiveSide } from '@/app/admin/eventos/[id]/operacao/types'
import type { OperatorAthlete } from '@/app/admin/eventos/[id]/operacao/types'
import { projectScoreWinnerHint } from '@/lib/live/winner-hint'
import type { LiveSessionPayload } from '@/app/admin/eventos/[id]/operacao/types'

export function FinishDialog({
  open,
  session,
  sideA,
  sideB,
  busy,
  onCancel,
  onConfirm,
}: {
  open: boolean
  session: LiveSessionPayload
  sideA: OperatorAthlete | null
  sideB: OperatorAthlete | null
  busy: boolean
  onCancel: () => void
  onConfirm: (winnerSide: LiveSide, resultType: LiveResultType) => void
}) {
  const hint = projectScoreWinnerHint(session)
  const [winnerSide, setWinnerSide] = useState<LiveSide | null>(hint === 'tie' ? null : hint)
  const [resultType, setResultType] = useState<LiveResultType>('points')
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="finish-title">
      <div className="w-full max-w-lg rounded-3xl bg-mc-structure p-5 text-white ring-1 ring-white/15 sm:p-6">
        <h2 id="finish-title" className="font-mc-display text-2xl font-bold">Encerrar luta</h2>
        <p className="mt-1 text-sm text-slate-300">Confira o placar e escolha o vencedor. Esta ação não confirma o resultado oficial.</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-black/30 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Lado A</p>
            <p className="font-semibold">{sideA?.name || 'A definir'}</p>
            <p className="mt-1 text-sm text-slate-300">{session.scoreA} pts · {session.advantagesA} vant. · {session.penaltiesA} pen.</p>
          </div>
          <div className="rounded-2xl bg-black/30 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Lado B</p>
            <p className="font-semibold">{sideB?.name || 'A definir'}</p>
            <p className="mt-1 text-sm text-slate-300">{session.scoreB} pts · {session.advantagesB} vant. · {session.penaltiesB} pen.</p>
          </div>
        </div>

        {hint !== 'tie' ? (
          <p className="mt-3 text-sm text-blue-200">
            Sugestão pelo placar: {hint === 'a' ? (sideA?.name || 'Lado A') : (sideB?.name || 'Lado B')}
          </p>
        ) : (
          <p className="mt-3 text-sm text-amber-200">Placar empatado — selecione o vencedor manualmente.</p>
        )}

        <fieldset className="mt-4">
          <legend className="text-sm font-semibold">Vencedor</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {([
              ['a', sideA?.name || 'Lado A'],
              ['b', sideB?.name || 'Lado B'],
            ] as const).map(([side, label]) => (
              <button
                key={side}
                type="button"
                onClick={() => setWinnerSide(side)}
                className={`min-h-12 rounded-xl px-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus ${
                  winnerSide === side ? 'bg-mc-action text-white' : 'bg-white/10 text-slate-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="mt-4 block text-sm font-semibold" htmlFor="result-type">
          Tipo de resultado
          <select
            id="result-type"
            className="mt-2 min-h-11 w-full rounded-xl border border-white/20 bg-black/40 px-3 text-sm text-white"
            value={resultType}
            onChange={(event) => setResultType(event.target.value as LiveResultType)}
          >
            <option value="points">Pontos</option>
            <option value="submission">Finalização</option>
            <option value="disqualification">Desqualificação</option>
            <option value="walkover">WO</option>
            <option value="referee_decision">Decisão do árbitro</option>
            <option value="other">Outro</option>
          </select>
        </label>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
          <button
            type="button"
            disabled={!winnerSide || busy}
            onClick={() => winnerSide && onConfirm(winnerSide, resultType)}
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-mc-error px-4 font-bold text-white disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Confirmar encerramento
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-white/10 px-4 font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  )
}
