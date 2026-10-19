import { COACHMARKS, type CoachmarkId } from '@/lib/onboarding/coachmarks'

export type { CoachmarkId }

export function Coachmark({ id }: { id: CoachmarkId; userId?: string }) {
  return (
    <details className="rounded-mc-small border border-mc-border bg-mc-surface">
      <summary className="cursor-pointer list-none px-3 py-1.5 font-mc-interface text-sm font-semibold text-mc-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mc-focus [&::-webkit-details-marker]:hidden">
        Ajuda desta etapa
      </summary>
      <p className="px-3 pb-2 font-mc-interface text-sm leading-5 text-mc-text-secondary">{COACHMARKS[id]}</p>
    </details>
  )
}
