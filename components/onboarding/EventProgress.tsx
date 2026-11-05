'use client'

import { useEffect, useRef } from 'react'
import { Check } from 'lucide-react'
import { EVENT_GUIDANCE_LABELS, type EventGuidanceStep } from '@/lib/onboarding/event-guidance'
import { cn } from '@/components/ui/utils'

const stateLabel: Record<EventGuidanceStep['state'], string> = {
  done: 'concluído',
  current: 'atual',
  upcoming: 'próximo',
  blocked: 'bloqueado',
}

export function EventProgress({
  steps,
  variant = 'expanded',
  label = 'Fase do evento',
}: {
  steps: EventGuidanceStep[]
  variant?: 'compact' | 'expanded'
  label?: string
}) {
  const listRef = useRef<HTMLOListElement>(null)
  const compact = variant === 'compact'

  useEffect(() => {
    const list = listRef.current
    const current = list?.querySelector<HTMLElement>('[aria-current="step"]')
    if (!list || !current || list.scrollWidth <= list.clientWidth) return
    const left = current.getBoundingClientRect().left - list.getBoundingClientRect().left + list.scrollLeft
    list.scrollLeft = Math.max(0, left - (list.clientWidth - current.offsetWidth) / 2)
  }, [steps])

  return (
    <section aria-label={label}>
      {compact ? null : (
        <h2 className="font-mc-interface text-[11px] font-semibold uppercase tracking-wide text-mc-text-secondary">
          {label}
        </h2>
      )}
      <ol
        ref={listRef}
        className={cn(
          'flex overflow-x-auto',
          compact ? 'mt-2 gap-0 pb-1' : 'mt-2 gap-2 pb-1 lg:overflow-visible',
        )}
      >
        {steps.map((step, index) => {
          const done = step.state === 'done'
          const current = step.state === 'current'
          const blocked = step.state === 'blocked'
          const previousDone = index > 0 && steps[index - 1]?.state === 'done'
          return (
            <li
              key={step.id}
              aria-current={current ? 'step' : undefined}
              aria-label={`${EVENT_GUIDANCE_LABELS[step.id]}, ${stateLabel[step.state]}`}
              className={cn('flex flex-1 flex-col', compact ? 'min-w-0 items-center' : 'min-w-[7rem] rounded-mc-small border px-3 py-2 lg:min-w-0', !compact && (current ? 'border-mc-action bg-mc-action/5' : 'border-mc-border bg-mc-surface'))}
            >
              {!compact ? <span className={cn('text-[10px] uppercase', current ? 'text-mc-action' : 'text-mc-text-secondary')}>{index + 1}. {stateLabel[step.state]}</span> : null}
              <div className={compact ? 'flex w-full items-center' : 'hidden'}>
                <span
                  aria-hidden="true"
                  className={cn(
                    'h-0.5 flex-1',
                    index === 0 ? 'bg-transparent' : previousDone || done || current ? 'bg-mc-action' : 'bg-mc-border',
                  )}
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    'inline-flex shrink-0 items-center justify-center rounded-full border font-mc-interface font-semibold',
                    compact ? 'h-3 w-3 text-[8px]' : 'h-8 w-8 text-xs',
                    done && 'border-mc-success bg-mc-success text-white',
                    current && 'border-mc-action bg-mc-action text-white',
                    !done && !current && !blocked && 'border-mc-border bg-mc-surface text-mc-text-secondary',
                    blocked && 'border-dashed border-mc-border bg-mc-surface-secondary text-mc-text-secondary',
                  )}
                >
                  {done ? <Check size={compact ? 9 : 14} /> : compact ? null : index + 1}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    'h-0.5 flex-1',
                    index === steps.length - 1 ? 'bg-transparent' : done ? 'bg-mc-action' : 'bg-mc-border',
                  )}
                />
              </div>
              <span
                className={cn(
                  'mt-1 font-mc-interface font-semibold leading-4',
                  compact ? 'text-center text-[8px]' : 'text-xs',
                  current ? 'text-mc-action' : done ? 'text-mc-text-primary' : 'text-mc-text-secondary',
                )}
              >
                {compact ? ({ configuracao: 'Config.', inscricoes: 'Insc.', pagamento: 'Pag.', checagem: 'Chec.', chaves: 'Chaves', programacao: 'Prog.', resultados: 'Res.', concluido: 'Fim' } as Record<string, string>)[step.id] || EVENT_GUIDANCE_LABELS[step.id] : EVENT_GUIDANCE_LABELS[step.id]}
              </span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
