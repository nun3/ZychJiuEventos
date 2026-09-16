import type { InputHTMLAttributes } from 'react'
import { cn } from './utils'

export type InputProps = InputHTMLAttributes<HTMLInputElement>

export function Input({ className, disabled, 'aria-invalid': ariaInvalid, ...props }: InputProps) {
  return (
    <input
      {...props}
      disabled={disabled}
      aria-invalid={ariaInvalid}
      className={cn(
        'min-h-11 w-full rounded-mc-small border border-mc-border bg-mc-surface px-3 py-2 font-mc-interface text-base text-mc-text-primary shadow-mc-none transition-colors duration-mc-normal placeholder:text-mc-text-secondary/70 hover:border-mc-text-secondary focus:border-mc-focus focus:outline-none focus:ring-2 focus:ring-mc-focus/20 disabled:cursor-not-allowed disabled:bg-mc-surface-secondary disabled:text-mc-text-secondary',
        ariaInvalid && 'border-mc-error focus:border-mc-error focus:ring-mc-error/20',
        className,
      )}
    />
  )
}
