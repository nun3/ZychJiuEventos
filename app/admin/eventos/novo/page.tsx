import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { DashboardPageHero } from '@/components/dashboard/DashboardPageHero'
import InternalNavigation from '@/components/InternalNavigation'
import { PageContainer } from '@/components/ui/PageContainer'
import { getDashboardActor } from '@/lib/auth/dashboard-actor'
import { getAdministrativeOrganizationContext } from '@/lib/auth/organization-context-server'
import { createClient } from '@/lib/supabase/server'
import NewEventForm from './NewEventForm'

export default async function NewEventPage() {
  const supabase = createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) redirect('/admin/autenticacao?redirectTo=%2Fadmin%2Feventos%2Fnovo')

  const organization = await getAdministrativeOrganizationContext()
  if (organization.status !== 'resolved') redirect('/dashboard?erro=sem_permissao')

  const actor = await getDashboardActor()

  return (
    <div className="min-h-screen bg-mc-background">
      <InternalNavigation
        canManageEvents={Boolean(actor?.canManageEvents)}
        canManageOrganization={Boolean(actor?.canManageOrganization)}
        isPlatformAdmin={Boolean(actor?.isPlatformAdmin)}
        fluid
      />
      <main className="py-5 sm:py-7">
        <PageContainer fluid className="space-y-5">
          <Link
            href="/admin/eventos"
            className="inline-flex min-h-10 items-center gap-2 font-mc-interface text-sm font-semibold text-mc-action hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2"
          >
            <ArrowLeft aria-hidden="true" size={16} />
            Voltar para eventos
          </Link>
          <DashboardPageHero
            title="Criar novo evento"
            description="Comece com o essencial. Depois você completa categorias, publicação e operação dentro do evento."
            actions={(
              <span className="inline-flex min-h-7 items-center rounded-mc-full bg-white/15 px-3 font-mc-interface text-xs font-semibold text-white">
                Rascunho
              </span>
            )}
          />
          <NewEventForm />
        </PageContainer>
      </main>
    </div>
  )
}
