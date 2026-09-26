'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { FirstStepsChecklist } from '@/lib/onboarding/checklists'
import {
  onboardingStorageKey,
  parseOnboardingPreferences,
} from '@/lib/onboarding/storage'

export function FirstStepsChecklistCard({
  userId,
  checklist,
}: {
  userId: string
  checklist: FirstStepsChecklist
}) {
  const [hidden, setHidden] = useState(false)
  const [ready, setReady] = useState(false)
  const storageKey = onboardingStorageKey(userId)
  const doneCount = checklist.items.filter((item) => item.done).length

  useEffect(() => {
    const state = parseOnboardingPreferences(window.localStorage.getItem(storageKey))
    setHidden(state.checklistHidden)
    setReady(true)
  }, [storageKey])

  function persist(nextHidden: boolean) {
    const current = parseOnboardingPreferences(window.localStorage.getItem(storageKey))
    window.localStorage.setItem(storageKey, JSON.stringify({ ...current, checklistHidden: nextHidden }))
    setHidden(nextHidden)
  }

  if (!ready) return null

  if (hidden) {
    return (
      <div className="flex justify-end">
        <Button type="button" variant="ghost" size="small" onClick={() => persist(false)}>
          Ver guia novamente
        </Button>
      </div>
    )
  }

  return (
    <Card className="p-mc-16 sm:p-mc-24" aria-labelledby="first-steps-title">
      <div className="flex flex-col gap-mc-12 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mc-interface text-xs font-semibold uppercase tracking-wide text-mc-text-secondary">Primeiros passos</p>
          <h2 id="first-steps-title" className="mt-mc-8 font-mc-display text-mc-h3 text-mc-text-primary">{checklist.title}</h2>
          <p className="mt-mc-8 font-mc-interface text-sm text-mc-text-secondary">{doneCount} de {checklist.items.length} concluídos</p>
        </div>
        <Button type="button" variant="ghost" size="small" onClick={() => persist(true)}>
          Agora não
        </Button>
      </div>
      <ol className="mt-mc-16 space-y-mc-8">
        {checklist.items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="flex min-h-11 items-center justify-between gap-mc-12 rounded-mc-small px-mc-8 py-mc-8 font-mc-interface text-sm transition-colors hover:bg-mc-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"
            >
              <span className={item.done ? 'text-mc-text-secondary line-through' : 'font-semibold text-mc-text-primary'}>
                {item.label}
              </span>
              <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-mc-text-secondary">
                {item.done ? 'feito' : 'fazer'}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </Card>
  )
}
