import type { ReactNode } from 'react'
import { cn } from './utils'

export type PageHeaderProps = {
  title: ReactNode
  description?: ReactNode
  breadcrumb?: ReactNode
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, description, breadcrumb, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('space-y-4', className)}>
      {breadcrumb && <nav aria-label="Breadcrumb" className="font-mc-interface text-sm text-mc-text-secondary">{breadcrumb}</nav>}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="font-mc-display text-mc-h1 text-mc-text-primary">{title}</h1>
          {description && <p className="max-w-2xl font-mc-interface text-mc-body text-mc-text-secondary">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  )
}
