import type { HTMLAttributes } from 'react'
import { cn } from './utils'

export type PageContainerProps = HTMLAttributes<HTMLDivElement>

export function PageContainer({ className, ...props }: PageContainerProps) {
  return <div {...props} className={cn('mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8', className)} />
}
