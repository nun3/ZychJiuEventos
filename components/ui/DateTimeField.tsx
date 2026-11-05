'use client'

import { useRef, type InputHTMLAttributes, type KeyboardEvent, type MouseEvent } from 'react'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { cn } from '@/components/ui/utils'

type DateTimeFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  type?: 'date' | 'datetime-local'
  clearLabel: string
  onValueChange?: (value: string) => void
}

function canShowPicker(input: HTMLInputElement) {
  return typeof input.showPicker === 'function'
}

export function DateTimeField({
  type = 'datetime-local',
  clearLabel,
  className,
  value,
  defaultValue,
  onChange,
  onValueChange,
  onKeyDown,
  ...props
}: DateTimeFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const controlled = value !== undefined

  function openPicker() {
    const input = inputRef.current
    if (!input || input.disabled || input.readOnly) return
    if (!canShowPicker(input)) return
    try {
      const result = input.showPicker() as void | Promise<void>
      if (result && typeof (result as Promise<void>).catch === 'function') {
        void (result as Promise<void>).catch(() => {
          // Gesto/gesto indireto ou browser sem suporte efetivo.
        })
      }
    } catch {
      // Alguns browsers exigem gesto direto no input; ignore.
    }
  }

  function handleWrapperClick(event: MouseEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest('[data-clear-date]')) return
    // Abrir só no clique (não no focus) evita loop focus→showPicker e rejeições não tratadas.
    openPicker()
  }

  function clear() {
    const input = inputRef.current
    if (!input || input.disabled) return
    input.value = ''
    onValueChange?.('')
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
    // Não chamar focus() aqui: em alguns browsers dispara showPicker e derruba a árvore.
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    if (event.key === 'Delete') {
      event.preventDefault()
      clear()
    }
  }

  return (
    <div className="relative" onClick={handleWrapperClick}>
      <Input
        {...props}
        ref={inputRef}
        type={type}
        value={controlled ? value : undefined}
        defaultValue={controlled ? undefined : defaultValue}
        onChange={(event) => {
          onChange?.(event)
          onValueChange?.(event.target.value)
        }}
        onKeyDown={handleKeyDown}
        className={cn('pr-11', className)}
      />
      <button
        type="button"
        data-clear-date
        aria-label={clearLabel}
        className="absolute right-1.5 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-mc-small text-mc-text-secondary transition-colors hover:bg-mc-surface-secondary hover:text-mc-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          clear()
        }}
      >
        <X aria-hidden="true" size={16} />
      </button>
    </div>
  )
}
