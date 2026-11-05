import Link from 'next/link'
import { ArrowRight, CircleCheck } from 'lucide-react'
import type { NextAction } from '@/lib/onboarding/event-guidance'
import { NextActionButton } from './NextActionButton'

export function NextActionCard({ action, eventId }: { action: NextAction; eventId: string }) {
  const factsLine = action.facts.length ? action.facts.join(' · ') : null
  const showLink = Boolean(action.href && action.cta && !action.transition)
  const showTransition = Boolean(action.transition && action.cta)

  return (
    <aside
      className="flex flex-col gap-2 rounded-mc-medium border border-mc-success/25 bg-mc-success/10 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
      aria-labelledby="next-action-title"
    >
      <div className="flex min-w-0 items-start gap-2">
        <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-mc-success text-white" aria-hidden="true">
          <CircleCheck size={16} />
        </span>
        <div className="min-w-0">
          <h2 id="next-action-title" className="font-mc-display text-base leading-6 text-mc-text-primary">
            {action.title}
          </h2>
          <p className="font-mc-interface text-sm leading-5 text-mc-text-secondary">
            {factsLine ? <span className="font-semibold text-mc-text-primary">{factsLine}. </span> : null}
            {action.message}
          </p>
        </div>
      </div>

      {showTransition && action.cta && action.transition ? (
        <NextActionButton eventId={eventId} status={action.transition} label={action.cta} />
      ) : null}

      {showLink && action.href && action.cta ? (
        <Link
          href={action.href}
          className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-mc-medium bg-mc-action px-3 font-mc-interface text-sm font-semibold text-white transition-colors duration-mc-normal hover:bg-mc-action/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2"
        >
          {action.cta}
          <ArrowRight aria-hidden="true" size={16} />
        </Link>
      ) : null}
    </aside>
  )
}
