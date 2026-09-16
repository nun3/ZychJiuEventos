'use client'

import { createContext, useContext, useId, useState, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from './utils'

type TabsContextValue = {
  value: string
  setValue: (value: string) => void
  baseId: string
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabsContext() {
  const context = useContext(TabsContext)
  if (!context) throw new Error('Tabs components must be used inside Tabs.')
  return context
}

export type TabsProps = {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  children: ReactNode
  className?: string
}

export function Tabs({ value: controlledValue, defaultValue = '', onValueChange, children, className }: TabsProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue)
  const value = controlledValue ?? uncontrolledValue
  const baseId = useId()
  const setValue = (nextValue: string) => {
    if (controlledValue === undefined) setUncontrolledValue(nextValue)
    onValueChange?.(nextValue)
  }

  return <TabsContext.Provider value={{ value, setValue, baseId }}><div className={className}>{children}</div></TabsContext.Provider>
}

export type TabsListProps = React.HTMLAttributes<HTMLDivElement>

export function TabsList({ className, ...props }: TabsListProps) {
  return <div {...props} role="tablist" className={cn('flex gap-1 border-b border-mc-border', className)} />
}

export type TabsTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  value: string
}

export function TabsTrigger({ value: triggerValue, className, onClick, onKeyDown, ...props }: TabsTriggerProps) {
  const { value, setValue, baseId } = useTabsContext()
  const selected = value === triggerValue
  const tabId = `${baseId}-tab-${triggerValue}`
  const panelId = `${baseId}-panel-${triggerValue}`

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    const tabs = Array.from(event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]') || [])
      .filter(tab => !tab.disabled)
    const index = tabs.indexOf(event.currentTarget)
    if (index < 0) return
    let nextIndex = index
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % tabs.length
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + tabs.length) % tabs.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = tabs.length - 1
    if (nextIndex !== index) {
      event.preventDefault()
      const nextTab = tabs[nextIndex]
      nextTab.focus()
      nextTab.click()
    }
  }

  return (
    <button
      {...props}
      type="button"
      id={tabId}
      role="tab"
      aria-selected={selected}
      aria-controls={panelId}
      tabIndex={selected ? 0 : -1}
      onClick={event => {
        onClick?.(event)
        if (!event.defaultPrevented) setValue(triggerValue)
      }}
      onKeyDown={handleKeyDown}
      className={cn('min-h-11 border-b-2 border-transparent px-3 py-2 font-mc-interface text-sm font-semibold text-mc-text-secondary transition-colors duration-mc-normal hover:text-mc-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mc-focus', selected && 'border-mc-action text-mc-action', className)}
    />
  )
}

export type TabsContentProps = React.HTMLAttributes<HTMLDivElement> & {
  value: string
}

export function TabsContent({ value: panelValue, className, ...props }: TabsContentProps) {
  const { value, baseId } = useTabsContext()
  const selected = value === panelValue
  if (!selected) return null
  return <div {...props} id={`${baseId}-panel-${panelValue}`} role="tabpanel" aria-labelledby={`${baseId}-tab-${panelValue}`} tabIndex={0} className={cn('pt-4 outline-none focus-visible:ring-2 focus-visible:ring-mc-focus', className)} />
}
