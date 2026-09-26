import { EVENT_GUIDANCE_LABELS, type EventGuidanceStep } from '@/lib/onboarding/event-guidance'

const stateLabel: Record<EventGuidanceStep['state'], string> = {
  done: 'concluído',
  current: 'atual',
  upcoming: 'próximo',
}

export function EventProgress({ steps }: { steps: EventGuidanceStep[] }) {
  return (
    <nav aria-label="Progresso do evento">
      <ol className="grid gap-mc-8 sm:grid-cols-2 xl:grid-cols-7">
        {steps.map((step, index) => (
          <li
            key={step.id}
            className={`rounded-mc-medium border px-mc-12 py-mc-12 ${
              step.state === 'current'
                ? 'border-mc-action bg-mc-action/5'
                : step.state === 'done'
                  ? 'border-mc-border bg-mc-surface'
                  : 'border-mc-border bg-mc-surface-secondary'
            }`}
          >
            <p className="font-mc-interface text-xs font-semibold uppercase tracking-wide text-mc-text-secondary">
              {index + 1}. {stateLabel[step.state]}
            </p>
            <p className={`mt-mc-4 font-mc-interface text-sm font-semibold ${
              step.state === 'upcoming' ? 'text-mc-text-secondary' : 'text-mc-text-primary'
            }`}>
              {EVENT_GUIDANCE_LABELS[step.id]}
            </p>
          </li>
        ))}
      </ol>
    </nav>
  )
}
