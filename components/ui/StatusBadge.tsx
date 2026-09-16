import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from './utils'

type StatusBadgeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'error'

export type StatusBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: StatusBadgeVariant
  icon?: ReactNode
}

const variants: Record<StatusBadgeVariant, string> = {
  neutral: 'bg-mc-surface-secondary text-mc-text-secondary',
  info: 'bg-mc-info/10 text-mc-info',
  success: 'bg-mc-success/10 text-mc-success',
  warning: 'bg-mc-warning/10 text-mc-warning',
  error: 'bg-mc-error/10 text-mc-error',
}

export function StatusBadge({ className, variant = 'neutral', icon, children, ...props }: StatusBadgeProps) {
  return (
    <span {...props} className={cn('inline-flex min-h-6 items-center gap-1.5 rounded-mc-full px-2.5 py-1 font-mc-interface text-xs font-semibold', variants[variant], className)}>
      {icon && <span aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </span>
  )
}
