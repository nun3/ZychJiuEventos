'use client'

import { createContext, useContext, useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type HTMLAttributes, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react'
import { cn } from './utils'

type DropdownContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  menuId: string
  triggerRef: React.RefObject<HTMLButtonElement>
}

const DropdownContext = createContext<DropdownContextValue | null>(null)

function useDropdownContext() {
  const context = useContext(DropdownContext)
  if (!context) throw new Error('Dropdown components must be used inside Dropdown.')
  return context
}

export type DropdownProps = {
  children: ReactNode
  className?: string
}

export function Dropdown({ children, className }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return <DropdownContext.Provider value={{ open, setOpen, menuId, triggerRef }}><div ref={rootRef} className={cn('relative inline-block', className)}>{children}</div></DropdownContext.Provider>
}

export type DropdownTriggerProps = ButtonHTMLAttributes<HTMLButtonElement>

export function DropdownTrigger({ className, onClick, ...props }: DropdownTriggerProps) {
  const { open, setOpen, menuId, triggerRef } = useDropdownContext()
  return (
    <button
      {...props}
      ref={triggerRef}
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={menuId}
      onClick={event => { onClick?.(event); if (!event.defaultPrevented) setOpen(!open) }}
      className={cn('inline-flex min-h-11 items-center justify-center rounded-mc-medium border border-mc-border bg-mc-surface px-4 py-2 font-mc-interface text-sm font-semibold text-mc-text-primary transition-colors duration-mc-normal hover:bg-mc-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus', className)}
    />
  )
}

export type DropdownMenuProps = HTMLAttributes<HTMLDivElement>

export function DropdownMenu({ className, onKeyDown, ...props }: DropdownMenuProps) {
  const { open, menuId, setOpen } = useDropdownContext()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
  }, [open])

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'))
      .filter(item => !item.disabled)
    if (!items.length) return
    const index = items.indexOf(document.activeElement as HTMLButtonElement)
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const nextIndex = event.key === 'ArrowDown' ? (index + 1) % items.length : (index - 1 + items.length) % items.length
      items[nextIndex]?.focus()
    }
    if (event.key === 'Home') { event.preventDefault(); items[0]?.focus() }
    if (event.key === 'End') { event.preventDefault(); items[items.length - 1]?.focus() }
    if (event.key === 'Tab') setOpen(false)
  }

  if (!open) return null
  return <div {...props} ref={menuRef} id={menuId} role="menu" onKeyDown={handleKeyDown} className={cn('absolute right-0 z-40 mt-2 min-w-48 rounded-mc-medium border border-mc-border bg-mc-surface p-1 shadow-mc-elevated motion-safe:transition-opacity duration-mc-fast', className)} />
}

export type DropdownItemProps = ButtonHTMLAttributes<HTMLButtonElement>

export function DropdownItem({ className, onClick, ...props }: DropdownItemProps) {
  const { setOpen } = useDropdownContext()
  return <button {...props} type="button" role="menuitem" onClick={event => { onClick?.(event); if (!event.defaultPrevented) setOpen(false) }} className={cn('flex min-h-11 w-full items-center rounded-mc-small px-3 py-2 text-left font-mc-interface text-sm text-mc-text-primary transition-colors duration-mc-fast hover:bg-mc-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus', className)} />
}
