import { loadEventGuidanceView } from '@/lib/onboarding/event-guidance-server'
import { EventGuidanceView } from './EventGuidanceView'

export async function EventGuidancePanel({ eventId }: { eventId: string }) {
  const view = await loadEventGuidanceView(eventId)
  if (!view) return null

  return <EventGuidanceView eventId={eventId} steps={view.steps} action={view.action} />
}
