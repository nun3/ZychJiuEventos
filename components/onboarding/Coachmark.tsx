'use client'

import { useEffect, useState } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import {
  isCoachmarkDismissed,
  onboardingStorageKey,
  parseOnboardingPreferences,
} from '@/lib/onboarding/storage'

export const COACHMARKS = {
  checagem: 'Depois de travar a checagem, alterações deixam de ser permitidas.',
  chaves: 'As chaves são geradas a partir das inscrições efetivadas após a checagem.',
  programacao: 'Os números das lutas seguem a sequência global do evento.',
  resultados: 'Confirme a pesagem e registre os resultados das lutas oficiais.',
  financeiro: 'O fechamento considera inscrições efetivadas e pagamentos confirmados.',
} as const

export type CoachmarkId = keyof typeof COACHMARKS

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
