import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from './utils'

type AlertVariant = 'neutral' | 'info' | 'success' | 'warning' | 'error'

export type AlertProps = HTMLAttributes<HTMLDivElement> & {
  variant?: AlertVariant
  title?: ReactNode
  icon?: ReactNode
  role?: 'alert' | 'status' | 'region'
}

const variants: Record<AlertVariant, string> = {
  neutral: 'border-mc-border bg-mc-surface-secondary text-mc-text-primary',
  info: 'border-mc-info/30 bg-mc-info/10 text-mc-text-primary',
  success: 'border-mc-success/30 bg-mc-success/10 text-mc-text-primary',
  warning: 'border-mc-warning/30 bg-mc-warning/10 text-mc-text-primary',
  error: 'border-mc-error/30 bg-mc-error/10 text-mc-text-primary',
}

export function Alert({ className, variant = 'neutral', title, icon, children, role, ...props }: AlertProps) {
  return (
    <div {...props} role={role} className={cn('flex gap-3 rounded-mc-medium border p-4 font-mc-interface text-sm', variants[variant], className)}>
      {icon && <span aria-hidden="true" className="shrink-0">{icon}</span>}
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        <div className={cn(title && 'mt-1')}>{children}</div>
      </div>
    </div>
  )
}
