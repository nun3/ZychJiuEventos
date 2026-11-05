import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from './utils'

type StatusBadgeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'error'

export type StatusBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: StatusBadgeVariant
  icon?: ReactNode
  onDark?: boolean
}

const marks: Record<StatusBadgeVariant, string> = {
  neutral: 'bg-mc-text-secondary',
  info: 'bg-mc-info',
  success: 'bg-mc-success',
  warning: 'bg-mc-warning',
  error: 'bg-mc-error',
}

export function StatusBadge({
  className,
  variant = 'neutral',
  icon,
  onDark = false,
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      {...props}
      className={cn(
        'inline-flex items-center font-mc-interface text-xs font-semibold',
        onDark ? 'text-white' : 'text-mc-text-primary',
        className,
      )}
    >
      <span aria-hidden="true" className={cn('mr-2 inline-block h-2 w-2 shrink-0', marks[variant])} />
      {icon ? (
        <span aria-hidden="true" className="mr-1.5 inline-flex">
          {icon}
        </span>
      ) : null}
      <span>{children}</span>
    </span>
  )
}
