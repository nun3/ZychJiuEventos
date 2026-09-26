import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import type { NextAction } from '@/lib/onboarding/event-guidance'

export function NextActionCard({ action }: { action: NextAction }) {
  return (
    <Card className="p-mc-16 sm:p-mc-24" aria-labelledby="next-action-title">
      <p className="font-mc-interface text-xs font-semibold uppercase tracking-wide text-mc-text-secondary">Próxima ação</p>
      <h2 id="next-action-title" className="mt-mc-8 font-mc-display text-mc-h3 text-mc-text-primary">{action.title}</h2>
      {action.facts.length ? (
        <ul className="mt-mc-12 space-y-mc-4 font-mc-interface text-sm text-mc-text-secondary">
          {action.facts.map((fact) => <li key={fact}>{fact}</li>)}
        </ul>
      ) : null}
      <p className="mt-mc-12 font-mc-interface text-sm text-mc-text-primary">{action.message}</p>
      {action.href && action.cta ? (
        <Link
          href={action.href}
          className="mt-mc-16 inline-flex min-h-11 items-center font-mc-interface text-sm font-semibold text-mc-action hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"
        >
          {action.cta}
        </Link>
      ) : null}
    </Card>
  )
}
