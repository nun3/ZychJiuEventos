import { Coachmark, type CoachmarkId } from './Coachmark'
import { EventProgress } from './EventProgress'
import { NextActionCard } from './NextActionCard'
import { loadEventGuidanceView } from '@/lib/onboarding/event-guidance-server'
import { createClient } from '@/lib/supabase/server'

export async function EventGuidancePanel({
  eventId,
  coachmark,
}: {
  eventId: string
  coachmark?: CoachmarkId
}) {
  const view = await loadEventGuidanceView(eventId)
  if (!view) return null
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <section className="mt-mc-24 space-y-mc-16" aria-label="Orientação do evento">
      <EventProgress steps={view.steps} />
      <NextActionCard action={view.action} />
      {coachmark && user ? <Coachmark id={coachmark} userId={user.id} /> : null}
    </section>
  )
}
