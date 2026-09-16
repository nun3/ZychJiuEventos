'use client'

import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react'
import { cn } from './utils'

export type DialogProps = {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  closeLabel?: string
  initialFocusRef?: RefObject<HTMLElement>
  className?: string
}

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function Dialog({ open, onClose, title, description, children, closeLabel = 'Fechar', initialFocusRef, className }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const dialog = dialogRef.current
    const requestedFocus = initialFocusRef?.current
    const focusTarget = requestedFocus && dialog?.contains(requestedFocus)
      ? requestedFocus
      : dialog?.querySelector<HTMLElement>(focusableSelector) || dialog
    focusTarget?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !dialog) return
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector))
      if (!focusable.length) {
        event.preventDefault()
        dialog.focus()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [initialFocusRef, onClose, open])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <div className="fixed inset-0 bg-mc-structure/50 motion-safe:transition-opacity duration-mc-normal" aria-hidden="true" onMouseDown={onClose} />
      <div className="relative flex min-h-full items-center justify-center">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          tabIndex={-1}
          className={cn('relative max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-mc-medium border border-mc-border bg-mc-surface p-6 shadow-mc-elevated outline-none sm:max-h-[calc(100vh-3rem)]', className)}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 id={titleId} className="font-mc-display text-mc-h2 text-mc-text-primary">{title}</h2>
              {description && <p id={descriptionId} className="mt-2 font-mc-interface text-mc-body text-mc-text-secondary">{description}</p>}
            </div>
            <button
              type="button"
              aria-label={closeLabel}
              onClick={onClose}
              className="shrink-0 rounded-mc-small p-2 font-mc-interface text-mc-text-secondary transition-colors duration-mc-fast hover:bg-mc-surface-secondary hover:text-mc-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"
            >
              <span aria-hidden="true" className="text-xl leading-none">×</span>
            </button>
          </div>
          {children && <div className="mt-6">{children}</div>}
        </div>
      </div>
    </div>
  )
}
