'use client'

import { useAdminEventSurface } from '@/components/AdminEventNav'
import { contextualizeNextAction, type EventGuidanceStep, type NextAction } from '@/lib/onboarding/event-guidance'
import { EventProgress } from './EventProgress'
import { NextActionCard } from './NextActionCard'

export function EventGuidanceView({
  eventId,
  steps,
  action,
}: {
  eventId: string
  steps: EventGuidanceStep[]
  action: NextAction
}) {
  const surface = useAdminEventSurface()
  const contextual = surface ? contextualizeNextAction(action, surface) : action

  return (
    <div className="mt-3 space-y-2">
      <EventProgress steps={steps} />
      <NextActionCard action={contextual} eventId={eventId} />
    </div>
  )
}
