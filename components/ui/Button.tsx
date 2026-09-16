import type { ButtonHTMLAttributes } from 'react'
import { cn } from './utils'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type ButtonSize = 'small' | 'medium' | 'large'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-mc-action text-white hover:bg-mc-action/90 focus-visible:ring-mc-focus',
  secondary: 'bg-mc-structure text-white hover:bg-mc-structure/90 focus-visible:ring-mc-focus',
  outline: 'border border-mc-border bg-mc-surface text-mc-text-primary hover:bg-mc-surface-secondary focus-visible:ring-mc-focus',
  ghost: 'bg-transparent text-mc-text-primary hover:bg-mc-surface-secondary focus-visible:ring-mc-focus',
  danger: 'bg-mc-error text-white hover:bg-mc-error/90 focus-visible:ring-mc-focus',
}

const sizes: Record<ButtonSize, string> = {
  small: 'min-h-9 px-3 text-sm',
  medium: 'min-h-10 px-4 text-sm',
  large: 'min-h-12 px-5 text-base',
}

export function Button({ className, type = 'button', variant = 'primary', size = 'medium', disabled, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center rounded-mc-medium font-mc-interface font-semibold transition-colors duration-mc-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
    />
  )
}
