'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import type { EventGuidanceTransition } from '@/lib/onboarding/event-guidance'
import { transitionEvent } from '@/app/admin/eventos/actions'

export function NextActionButton({
  eventId,
  status,
  label,
}: {
  eventId: string
  status: EventGuidanceTransition
  label: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  return (
    <div className="flex shrink-0 flex-col items-stretch gap-1 sm:items-end">
      <Button
        size="small"
        className="gap-2"
        disabled={pending}
        onClick={() => {
          setError('')
          startTransition(async () => {
            const result = await transitionEvent(eventId, status)
            if (!result.ok) setError(result.message)
            else router.refresh()
          })
        }}
      >
        {pending ? 'Salvando...' : label}
        <ArrowRight aria-hidden="true" size={16} />
      </Button>
      {error ? <Alert variant="error" role="alert" className="p-2 text-sm">{error}</Alert> : null}
    </div>
  )
}
