'use client'

import { useEffect, useState } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { COACHMARKS, type CoachmarkId } from '@/lib/onboarding/coachmarks'
import {
  isCoachmarkDismissed,
  onboardingStorageKey,
  parseOnboardingPreferences,
} from '@/lib/onboarding/storage'

export type { CoachmarkId }

export function Coachmark({ id, userId }: { id: CoachmarkId; userId: string }) {
  const [hidden, setHidden] = useState(true)
  const [ready, setReady] = useState(false)
  const storageKey = onboardingStorageKey(userId)

  useEffect(() => {
    const state = parseOnboardingPreferences(window.localStorage.getItem(storageKey))
    setHidden(isCoachmarkDismissed(state, id))
    setReady(true)
  }, [id, storageKey])

  function persist(nextHidden: boolean) {
    const current = parseOnboardingPreferences(window.localStorage.getItem(storageKey))
    const next = {
      ...current,
      coachmarks: { ...current.coachmarks, [id]: nextHidden },
    }
    window.localStorage.setItem(storageKey, JSON.stringify(next))
    setHidden(nextHidden)
  }

  if (!ready) return null

  if (hidden) {
    return (
      <div className="mt-mc-16">
        <Button type="button" variant="ghost" size="small" onClick={() => persist(false)}>
          Ver guia novamente
        </Button>
      </div>
    )
  }

  return (
    <Alert className="mt-mc-16" variant="info" role="status" title="Orientação">
      <p>{COACHMARKS[id]}</p>
      <div className="mt-mc-12 flex flex-wrap gap-mc-8">
        <Button type="button" size="small" onClick={() => persist(true)}>Entendi</Button>
        <Button type="button" variant="ghost" size="small" onClick={() => persist(true)}>Agora não</Button>
      </div>
    </Alert>
  )
}
