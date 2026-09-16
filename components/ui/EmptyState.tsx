import type { ReactNode } from 'react'
import { cn } from './utils'

export type EmptyStateProps = {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  icon?: ReactNode
  className?: string
}

export function EmptyState({ title, description, action, icon, className }: EmptyStateProps) {
  return (
    <section className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      {icon && <div aria-hidden="true" className="mb-4 text-mc-text-secondary">{icon}</div>}
      <h2 className="font-mc-display text-mc-h2 text-mc-text-primary">{title}</h2>
      {description && <p className="mt-2 max-w-lg font-mc-interface text-mc-body text-mc-text-secondary">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </section>
  )
}
