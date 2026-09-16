import { cn } from './utils'

export type LoadingStateProps = {
  text?: string
  skeleton?: boolean
  className?: string
}

export function LoadingState({ text = 'Carregando...', skeleton = false, className }: LoadingStateProps) {
  if (skeleton) {
    return (
      <div role="status" aria-label={text} className={cn('space-y-3', className)}>
        <div className="motion-safe:animate-pulse rounded-mc-small bg-mc-surface-secondary h-4 w-2/3" />
        <div className="motion-safe:animate-pulse rounded-mc-small bg-mc-surface-secondary h-4 w-full" />
        <div className="motion-safe:animate-pulse rounded-mc-small bg-mc-surface-secondary h-4 w-5/6" />
      </div>
    )
  }

  return (
    <div role="status" aria-live="polite" className={cn('flex items-center gap-3 font-mc-interface text-sm text-mc-text-secondary', className)}>
      <span aria-hidden="true" className="h-4 w-4 rounded-mc-full border-2 border-mc-border border-t-mc-action motion-safe:animate-spin" />
      <span>{text}</span>
    </div>
  )
}
