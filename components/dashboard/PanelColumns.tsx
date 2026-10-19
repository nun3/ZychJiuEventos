import type { ReactNode } from 'react'
import { cn } from '@/components/ui/utils'

export const panelClass = 'rounded-mc-medium border border-mc-border bg-mc-surface p-4 shadow-mc-subtle sm:p-5'

export function PanelColumns({
  main,
  aside,
  className,
  asideFirstOnMobile = false,
}: {
  main: ReactNode
  aside: ReactNode
  className?: string
  asideFirstOnMobile?: boolean
}) {
  return (
    <div className={cn('grid items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(17rem,0.9fr)]', className)}>
      <div className={cn('min-w-0 space-y-5', asideFirstOnMobile && 'order-2 xl:order-1')}>{main}</div>
      <div className={cn('min-w-0 space-y-5', asideFirstOnMobile && 'order-1 xl:order-2')}>{aside}</div>
    </div>
  )
}
