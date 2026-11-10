import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getDashboardActor } from '@/lib/auth/dashboard-actor'
import { getAdministrativeOrganizationContext } from '@/lib/auth/organization-context-server'
import { createClient } from '@/lib/supabase/server'
import InternalNavigation from '@/components/InternalNavigation'
import { PageContainer } from '@/components/ui/PageContainer'
import { loadOrganizerEventHub } from '@/lib/onboarding/dashboard-facts'
import { EventsHub } from './EventsHub'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function OrganizerEventsPage({
  searchParams,
}: {
  searchParams?: { org?: string }
}) {
  const supabase = createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) redirect('/admin/autenticacao?redirectTo=%2Fadmin%2Feventos')

  const requestedOrganizationId = searchParams?.org
  const organization = await getAdministrativeOrganizationContext(
    requestedOrganizationId && uuidPattern.test(requestedOrganizationId) ? requestedOrganizationId : undefined,
  )
  if (organization.status !== 'resolved' && organization.reason !== 'ambiguous') {
    redirect('/dashboard?erro=sem_permissao')
  }

  const actor = await getDashboardActor()

  if (organization.status !== 'resolved') {
    return (
      <div className="min-h-screen bg-mc-background">
        <InternalNavigation
          canManageEvents={Boolean(actor?.canManageEvents)}
          canManageOrganization={Boolean(actor?.canManageOrganization)}
          isPlatformAdmin={Boolean(actor?.isPlatformAdmin)}
          fluid
        />
        <main className="py-5 sm:py-7">
          <PageContainer className="space-y-4">
            <h1 className="font-mc-display text-xl font-semibold text-mc-text-primary">Escolha uma organização</h1>
            <p className="font-mc-interface text-sm text-mc-text-secondary">Sua conta administra mais de uma organização. Escolha de qual você quer ver os eventos.</p>
            <ul className="space-y-2">
              {organization.options?.map((option) => (
                <li key={option.organizationId}>
                  <Link
                    href={`/admin/eventos?org=${option.organizationId}`}
                    className="inline-flex min-h-11 items-center rounded-mc-medium border border-mc-border px-4 font-mc-interface text-sm font-semibold text-mc-action hover:underline"
                  >
                    {option.organizationName || option.organizationId}
                  </Link>
                </li>
              ))}
            </ul>
          </PageContainer>
        </main>
      </div>
    )
  }

  const hub = await loadOrganizerEventHub(organization.context.organizationId)

  return (
    <div className="min-h-screen bg-mc-background">
      <InternalNavigation
        canManageEvents={Boolean(actor?.canManageEvents)}
        canManageOrganization={Boolean(actor?.canManageOrganization)}
        isPlatformAdmin={Boolean(actor?.isPlatformAdmin)}
        fluid
      />
      <main className="mc-content-enter">
        <EventsHub cards={hub.cards} rows={hub.rows} error={hub.error} />
      </main>
    </div>
  )
}
