import type { HTMLAttributes } from 'react'
import { cn } from './utils'

export type PageContainerProps = HTMLAttributes<HTMLDivElement> & {
  fluid?: boolean
}

export function PageContainer({ className, fluid = false, ...props }: PageContainerProps) {
  return (
    <div
      {...props}
      className={cn(
        'mx-auto w-full',
        fluid ? 'px-4 sm:px-8 lg:px-[4vw]' : 'max-w-7xl px-4 sm:px-6 lg:px-8',
        className,
      )}
    />
  )
}
