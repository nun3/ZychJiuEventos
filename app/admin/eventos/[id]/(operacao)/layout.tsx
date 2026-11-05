import { Suspense, type ReactNode } from 'react'
import InternalNavigation from '@/components/InternalNavigation'
import { EventAdminShell } from '@/components/events/admin/EventAdminShell'
import { EventGuidancePanel } from '@/components/onboarding/EventGuidancePanel'
import { PageContainer } from '@/components/ui/PageContainer'
import { getDashboardActor } from '@/lib/auth/dashboard-actor'
import { ADMIN_EVENT_HERO_SELECT, toAdminEventHeroData } from '@/lib/events/admin-event-presentation'
import { allowsPublicOrganization } from '@/lib/events/public-organization'
import { createClient } from '@/lib/supabase/server'

function GuidanceFallback() {
  return (
    <div className="mt-3 space-y-2" aria-hidden="true">
      <div className="h-14 animate-pulse rounded-mc-medium bg-mc-surface-secondary motion-reduce:animate-none" />
      <div className="h-12 animate-pulse rounded-mc-medium bg-mc-surface-secondary motion-reduce:animate-none" />
    </div>
  )
}

export default async function EventOperationLayout({
  children,
  params,
}: {
  children: ReactNode
  params: { id: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return children

  const [{ data: event }, actor] = await Promise.all([
    supabase
      .from('events')
      .select(`${ADMIN_EVENT_HERO_SELECT}, organization_id`)
      .eq('id', params.id)
      .maybeSingle(),
    getDashboardActor(),
  ])

  if (!event || !allowsPublicOrganization(event.organization_id)) return children

  return (
    <div className="min-h-screen bg-mc-background">
      <InternalNavigation
        canManageEvents={Boolean(actor?.canManageEvents ?? true)}
        canManageOrganization={Boolean(actor?.canManageOrganization)}
        isPlatformAdmin={Boolean(actor?.isPlatformAdmin)}
        fluid
      />
      <main className="py-4 sm:py-6">
        <PageContainer fluid className="min-w-0">
          <EventAdminShell
            event={toAdminEventHeroData(event)}
            guidance={(
              <Suspense fallback={<GuidanceFallback />}>
                <EventGuidancePanel eventId={event.id} />
              </Suspense>
            )}
          >
            {children}
          </EventAdminShell>
        </PageContainer>
      </main>
    </div>
  )
}
