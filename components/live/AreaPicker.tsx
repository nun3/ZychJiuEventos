'use client'

import type { OperatorArea } from '@/app/admin/eventos/[id]/operacao/types'

export function AreaPicker({
  areas,
  onSelect,
}: {
  areas: OperatorArea[]
  onSelect: (areaId: string) => void
}) {
  if (areas.length === 0) {
    return (
      <div className="rounded-3xl bg-black/30 p-6 text-center ring-1 ring-white/10">
        <h2 className="font-mc-display text-2xl font-bold text-white">Nenhuma área ativa</h2>
        <p className="mt-2 text-sm text-slate-300">Publique a programação e ative ao menos uma área para operar.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl rounded-3xl bg-black/30 p-6 ring-1 ring-white/10">
      <h2 className="font-mc-display text-2xl font-bold text-white">Escolha a área</h2>
      <p className="mt-1 text-sm text-slate-300">A mesa opera uma área por vez.</p>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {areas.map((area) => (
          <li key={area.areaId}>
            <button
              type="button"
              onClick={() => onSelect(area.areaId)}
              className="flex min-h-14 w-full items-center justify-between rounded-2xl bg-mc-action px-4 text-left font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <span>Área {area.number}</span>
              <span className="text-sm font-medium text-blue-100">{area.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
