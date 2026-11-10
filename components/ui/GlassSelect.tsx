'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export interface GlassSelectOption {
  value: string
  label: string
}

interface GlassSelectProps {
  /** Nome acessível do campo (ex.: "Estado"). */
  label: string
  value: string
  options: GlassSelectOption[]
  onChange: (value: string) => void
  id?: string
  className?: string
  /** Chamado ao abrir, para o pai fechar outros painéis flutuantes. */
  onOpen?: () => void
  /** 'light' para fundos claros (Home atual); 'dark' mantém o vidro original. */
  tone?: 'dark' | 'light'
}

const normalize = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/**
 * Combobox "select-only" em vidro (padrão ARIA): abre um listbox, navega por setas/Home/End,
 * escolhe com Enter/Espaço, fecha com Esc/Tab/clique fora e salta por letra digitada.
 * Substitui o <select> nativo apenas onde o desenho pede vidro; o formulário continua sendo controlado pelo pai.
 */
export function GlassSelect({ label, value, options, onChange, id, className = '', onOpen, tone = 'dark' }: GlassSelectProps) {
  const light = tone === 'light'
  const autoId = useId()
  const baseId = id ?? `gs-${autoId.replace(/:/g, '')}`
  const listId = `${baseId}-list`
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value))
  const selected = options[selectedIndex]

  const openList = useCallback(() => {
    onOpen?.()
    setActive(selectedIndex)
    setOpen(true)
  }, [onOpen, selectedIndex])

  const closeList = useCallback(() => setOpen(false), [])

  const pick = useCallback(
    (index: number) => {
      const option = options[index]
      if (!option) return
      onChange(option.value)
      setOpen(false)
      buttonRef.current?.focus()
    },
    [onChange, options],
  )

  // Fecha ao clicar/tocar fora.
  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [open])

  // Mantém a opção ativa visível no painel com rolagem.
  useEffect(() => {
    if (!open) return
    listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  const onKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    const last = options.length - 1
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        if (!open) openList()
        else setActive((current) => Math.min(last, current + 1))
        return
      case 'ArrowUp':
        event.preventDefault()
        if (!open) openList()
        else setActive((current) => Math.max(0, current - 1))
        return
      case 'Home':
        if (open) { event.preventDefault(); setActive(0) }
        return
      case 'End':
        if (open) { event.preventDefault(); setActive(last) }
        return
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (open) pick(active)
        else openList()
        return
      case 'Escape':
        if (open) { event.preventDefault(); event.stopPropagation(); closeList() }
        return
      case 'Tab':
        closeList()
        return
      default:
        if (event.key.length === 1 && /\S/.test(event.key) && !event.ctrlKey && !event.metaKey && !event.altKey) {
          if (!open) openList()
          const letter = normalize(event.key)
          for (let step = 1; step <= options.length; step += 1) {
            const index = (active + step) % options.length
            const text = options[index].label
            if (normalize(text).startsWith(letter) || normalize(text.replace(/^[A-Z]{2} — /, '')).startsWith(letter)) {
              setActive(index)
              break
            }
          }
        }
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        id={baseId}
        type="button"
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${baseId}-opt-${active}` : undefined}
        onClick={() => (open ? closeList() : openList())}
        onKeyDown={onKeyDown}
        className={`flex h-12 w-full min-w-0 items-center justify-between gap-2 rounded-xl border px-3.5 text-left font-mc-interface text-sm transition-[background-color,border-color,box-shadow] duration-200 focus-visible:outline-none ${
          light
            ? `bg-white text-slate-900 hover:bg-slate-50 ${open ? 'border-mc-action shadow-[0_0_0_3px_rgba(37,99,235,0.18)]' : 'border-slate-300 focus-visible:border-mc-action focus-visible:shadow-[0_0_0_3px_rgba(37,99,235,0.18)]'}`
            : `bg-white/[0.06] text-white hover:bg-white/10 ${open ? 'border-blue-300/80 bg-white/10 shadow-[0_0_0_3px_rgba(37,99,235,0.28)]' : 'border-white/15 focus-visible:border-blue-300/80 focus-visible:shadow-[0_0_0_3px_rgba(37,99,235,0.28)]'}`
        }`}
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown
          aria-hidden="true"
          size={18}
          className={`shrink-0 opacity-70 transition-transform duration-200 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <div
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label={label}
        hidden={!open}
        // mousedown não pode roubar o foco do botão, senão o teclado deixa de funcionar.
        onMouseDown={(event) => event.preventDefault()}
        className={`${light ? 'rounded-2xl border border-slate-200 bg-white shadow-mc-elevated' : 'mc-glass-pop rounded-2xl [scrollbar-color:rgba(255,255,255,0.28)_transparent]'} absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 max-h-72 overflow-auto p-1.5 [scrollbar-width:thin]`}
      >
        {options.map((option, index) => {
          const isSelected = option.value === value
          return (
            <div
              key={option.value}
              id={`${baseId}-opt-${index}`}
              role="option"
              aria-selected={isSelected}
              onClick={() => pick(index)}
              onMouseMove={() => active !== index && setActive(index)}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 font-mc-interface text-sm ${
                light
                  ? `${index === active ? 'bg-slate-100 text-slate-900' : 'text-slate-600'} ${isSelected ? 'font-semibold text-slate-900' : ''}`
                  : `${index === active ? 'bg-white/10 text-white' : 'text-white/70'} ${isSelected ? 'font-semibold text-white' : ''}`
              }`}
            >
              <span className="truncate">{option.label}</span>
              {isSelected ? <Check aria-hidden="true" size={16} className={`shrink-0 ${light ? 'text-mc-action' : 'text-blue-300'}`} /> : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
