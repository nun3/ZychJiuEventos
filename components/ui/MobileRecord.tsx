import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from './utils'

export type MobileRecordProps = HTMLAttributes<HTMLElement>

export function MobileRecord({ className, ...props }: MobileRecordProps) {
  return <article {...props} className={cn('rounded-mc-medium border border-mc-border bg-mc-surface p-4 shadow-mc-none', className)} />
}

export type MobileRecordHeaderProps = HTMLAttributes<HTMLDivElement>

export function MobileRecordHeader({ className, ...props }: MobileRecordHeaderProps) {
  return <div {...props} className={cn('flex items-start justify-between gap-3', className)} />
}

export type MobileRecordTitleProps = HTMLAttributes<HTMLHeadingElement> & {
  children: ReactNode
}

export function MobileRecordTitle({ className, ...props }: MobileRecordTitleProps) {
  return <h3 {...props} className={cn('font-mc-display text-mc-h3 text-mc-text-primary', className)} />
}

export type MobileRecordMetaProps = HTMLAttributes<HTMLDivElement>

export function MobileRecordMeta({ className, ...props }: MobileRecordMetaProps) {
  return <div {...props} className={cn('mt-1 font-mc-interface text-sm text-mc-text-secondary', className)} />
}

export type MobileRecordStatusProps = HTMLAttributes<HTMLDivElement>

export function MobileRecordStatus({ className, ...props }: MobileRecordStatusProps) {
  return <div {...props} className={cn('mt-4 flex flex-wrap items-center gap-2', className)} />
}

export type MobileRecordActionsProps = HTMLAttributes<HTMLDivElement>

export function MobileRecordActions({ className, ...props }: MobileRecordActionsProps) {
  return <div {...props} className={cn('mt-4 flex flex-wrap items-center gap-2', className)} />
}
