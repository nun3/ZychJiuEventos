import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { DashboardPageHero } from '@/components/dashboard/DashboardPageHero'
import InternalNavigation from '@/components/InternalNavigation'
import { PageContainer } from '@/components/ui/PageContainer'
import { getDashboardActor } from '@/lib/auth/dashboard-actor'
import { getAdministrativeOrganizationContext } from '@/lib/auth/organization-context-server'
import { allowsPublicOrganization } from '@/lib/events/public-organization'
import { createClient } from '@/lib/supabase/server'
import EditEventForm from './EditEventForm'

export default async function EditEventPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) {
    redirect(`/admin/autenticacao?redirectTo=${encodeURIComponent(`/admin/eventos/${params.id}/editar`)}`)
  }

  const organization = await getAdministrativeOrganizationContext()
  if (organization.status !== 'resolved') redirect('/dashboard?erro=sem_permissao')

  const actor = await getDashboardActor()
  const { data: event } = await supabase
    .from('events')
    .select('id, nome, data_evento, local, timezone, valor_inscricao, informacoes, status, organization_id, local_nome, local_cep, local_logradouro, local_numero, local_complemento, local_bairro, local_cidade, local_uf, local_latitude, local_longitude')
    .eq('id', params.id)
    .maybeSingle()

  if (!event || event.status !== 'rascunho' || !allowsPublicOrganization(event.organization_id)) notFound()

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
            Voltar à lista
          </Link>
          <DashboardPageHero
            title="Editar rascunho"
            description="Ajuste o essencial do campeonato. Categorias, publicação e operação continuam na área do evento."
            actions={(
              <span className="inline-flex min-h-7 items-center rounded-mc-full bg-white/15 px-3 font-mc-interface text-xs font-semibold text-white">
                Rascunho
              </span>
            )}
          />
          <EditEventForm event={event} />
        </PageContainer>
      </main>
    </div>
  )
}
