import { redirect } from 'next/navigation'
import { getDashboardActor } from '@/lib/auth/dashboard-actor'
import { getAdministrativeOrganizationContext } from '@/lib/auth/organization-context-server'
import { createClient } from '@/lib/supabase/server'
import InternalNavigation from '@/components/InternalNavigation'
import { loadOrganizerEventHub } from '@/lib/onboarding/dashboard-facts'
import { EventsHub } from './EventsHub'

export default async function OrganizerEventsPage() {
  const supabase = createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) redirect('/admin/autenticacao?redirectTo=%2Fadmin%2Feventos')

  const organization = await getAdministrativeOrganizationContext()
  if (organization.status !== 'resolved') redirect('/dashboard?erro=sem_permissao')

  const actor = await getDashboardActor()
  const hub = await loadOrganizerEventHub(organization.context.organizationId)

  return (
    <div className="min-h-screen bg-mc-background">
      <InternalNavigation
        canManageEvents={Boolean(actor?.canManageEvents)}
        canManageOrganization={Boolean(actor?.canManageOrganization)}
        isPlatformAdmin={Boolean(actor?.isPlatformAdmin)}
        fluid
      />
      <main>
        <EventsHub cards={hub.cards} rows={hub.rows} error={hub.error} />
      </main>
    </div>
  )
}
