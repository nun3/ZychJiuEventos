import type { HTMLAttributes } from 'react'
import { cn } from './utils'

type CardVariant = 'default' | 'subtle'

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant
}

export function Card({ className, variant = 'default', ...props }: CardProps) {
  return (
    <div
      {...props}
      className={cn(
        'rounded-mc-medium border border-mc-border bg-mc-surface',
        variant === 'subtle' && 'shadow-mc-subtle',
        className,
      )}
    />
  )
}
