'use client'

import type { OperatorQueueMatch } from '@/app/admin/eventos/[id]/operacao/types'

export function MatchQueue({
  items,
  currentMatchId,
  onSelect,
}: {
  items: OperatorQueueMatch[]
  currentMatchId: string | null
  onSelect: (matchId: string) => void
}) {
  const upcoming = items.filter((item) => item.matchId !== currentMatchId).slice(0, 3)
  if (upcoming.length === 0) {
    return (
      <aside className="rounded-2xl bg-black/25 p-3 ring-1 ring-white/10" aria-label="Fila da área">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-slate-400">Próximas lutas</p>
        <p className="mt-2 text-sm text-slate-300">Nenhuma luta seguinte nesta área.</p>
      </aside>
    )
  }

  return (
    <aside className="rounded-2xl bg-black/25 p-3 ring-1 ring-white/10" aria-label="Fila da área">
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-slate-400">Próximas lutas</p>
      <ul className="mt-2 space-y-2">
        {upcoming.map((item, index) => (
          <li key={item.matchId}>
            <button
              type="button"
              onClick={() => onSelect(item.matchId)}
              className="flex min-h-11 w-full items-start gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"
            >
              <span className="mt-0.5 inline-flex min-w-10 justify-center rounded-md bg-white/10 px-2 py-1 text-xs font-bold tabular-nums text-slate-200">
                #{item.fightNumber}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-white">
                  {index === 0 ? 'Próxima' : `Em seguida`} · {item.category}
                </span>
                <span className="block truncate text-xs text-slate-400">
                  {(item.sideA?.name || 'A definir')} × {(item.sideB?.name || 'A definir')}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  )
}
