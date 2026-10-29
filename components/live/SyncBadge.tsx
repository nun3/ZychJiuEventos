'use client'

export type SyncState = 'synced' | 'updating' | 'conflict' | 'offline' | 'error'

const LABELS: Record<SyncState, string> = {
  synced: 'Sincronizado',
  updating: 'Atualizando',
  conflict: 'Conflito detectado',
  offline: 'Sem conexão',
  error: 'Erro',
}

const STYLES: Record<SyncState, string> = {
  synced: 'bg-mc-success/15 text-mc-success ring-mc-success/30',
  updating: 'bg-mc-action/15 text-mc-action ring-mc-action/30',
  conflict: 'bg-mc-warning/15 text-mc-warning ring-mc-warning/40',
  offline: 'bg-mc-error/15 text-mc-error ring-mc-error/30',
  error: 'bg-mc-error/15 text-mc-error ring-mc-error/30',
}

export function SyncBadge({ state }: { state: SyncState }) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={`inline-flex min-h-9 items-center gap-2 rounded-full px-3 text-xs font-bold uppercase tracking-[0.08em] ring-1 ${STYLES[state]}`}
    >
      <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />
      {LABELS[state]}
    </span>
  )
}
