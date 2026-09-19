import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import ModernNavbar from '@/components/ModernNavbar'
import { Alert } from '@/components/ui/Alert'
import { PageContainer } from '@/components/ui/PageContainer'
import { PageHeader } from '@/components/ui/PageHeader'
import { createClient } from '@/lib/supabase/server'
import { getDashboardActor } from '@/lib/auth/dashboard-actor'
import { findPublicReleaseEvent } from '@/lib/events/public-access'
import RegistrationForm from './RegistrationForm'

export default async function RegistrationPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const [{ data: { user } }, actor] = await Promise.all([
    supabase.auth.getUser(),
    getDashboardActor(),
  ])
  if (!user) redirect(`/login?redirectTo=${encodeURIComponent(`/eventos/${params.id}/inscricao/cadastrar-atleta`)}`)
  const event = await findPublicReleaseEvent(params.id, null)
  if (!event) notFound()
  const [phases, managers, athletes, rules, registrations] = await Promise.all([
    supabase.from('event_phases').select('inicio, fim').eq('event_id', event.id).eq('tipo', 'inscricao'),
    supabase.from('athlete_managers').select('athlete_id').eq('manager_id', user.id),
    supabase.from('athletes').select('id, user_id, nome_completo, data_nascimento, genero, faixa, peso_kg'),
    supabase.from('category_rule_sets').select('event_categories(*)').eq('event_id', event.id).eq('ativo', true).maybeSingle(),
    supabase.from('registrations').select('athlete_id').eq('event_id', event.id).in('status', ['rascunho', 'pendente_pagamento', 'efetivada']),
  ])
  const failed = [phases, managers, athletes, rules, registrations].some(r => r.error)
  const now = Date.now()
  const open = event.status === 'inscricao' && phases.data?.some(p => now >= Date.parse(p.inicio) && now <= Date.parse(p.fim))
  const managed = new Set(managers.data?.map(m => m.athlete_id))
  const allowed = athletes.data?.filter(a => a.user_id === user.id || managed.has(a.id)) || []
  return (
    <main className="min-h-screen bg-mc-background">
      <ModernNavbar />
      <PageContainer className="pb-mc-64 pt-32 sm:pt-36">
        <PageHeader
          title={`Inscrição — ${event.nome}`}
          description="Selecione os atletas elegíveis, confira a categoria calculada e aceite os termos para confirmar."
          breadcrumb={(
            <Link href={`/eventos/${event.id}`} className="inline-flex min-h-10 items-center gap-mc-8 font-semibold text-mc-action hover:underline">
              <ArrowLeft aria-hidden="true" size={18} />
              Voltar ao evento
            </Link>
          )}
        />
        <div className="mt-mc-32">
          {failed ? (
            <Alert variant="error" role="alert">Não foi possível carregar os dados. Tente novamente.</Alert>
          ) : !open ? (
            <Alert variant="warning" role="alert" title="Inscrições indisponíveis">Este evento está fora do prazo de inscrição.</Alert>
          ) : (
            <RegistrationForm
              event={event}
              athletes={allowed}
              categories={rules.data?.event_categories || []}
              registeredIds={registrations.data?.map(r => r.athlete_id) || []}
              actor={{ name: actor?.name || '', canLinkSelf: Boolean(actor?.isProfessor) }}
            />
          )}
        </div>
      </PageContainer>
    </main>
  )
}
