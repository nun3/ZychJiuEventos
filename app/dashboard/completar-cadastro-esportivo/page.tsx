import Link from 'next/link'
import { redirect } from 'next/navigation'
import { UsersRound } from 'lucide-react'
import { getDashboardActor } from '@/lib/auth/dashboard-actor'
import { getPublicOrganizationScope } from '@/lib/events/public-organization'
import { createClient } from '@/lib/supabase/server'
import { Alert } from '@/components/ui/Alert'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageContainer } from '@/components/ui/PageContainer'
import { PageHeader } from '@/components/ui/PageHeader'
import CompleteSportsProfileForm from './CompleteSportsProfileForm'

function safeRedirect(value: string | undefined) {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/dashboard'
}

export default async function CompleteSportsProfilePage({
  searchParams,
}: {
  searchParams: { redirectTo?: string }
}) {
  const actor = await getDashboardActor()
  if (!actor) redirect('/login?redirectTo=/dashboard/completar-cadastro-esportivo')
  if (actor.tipoCadastro !== 'atleta') redirect('/dashboard')
  if (actor.hasSelfAthlete) redirect(safeRedirect(searchParams.redirectTo))

  const supabase = createClient()
  const scope = getPublicOrganizationScope()
  const [{ data: profile }, teamsResult] = await Promise.all([
    supabase.from('profiles').select('nome_completo, data_nascimento').eq('id', actor.userId).maybeSingle(),
    scope.mode === 'restricted'
      ? supabase.from('teams').select('id, nome').eq('organization_id', scope.organizationId).order('nome')
      : Promise.resolve({ data: [] as Array<{ id: string; nome: string }>, error: null }),
  ])
  const teams = teamsResult.data || []
  const redirectTo = safeRedirect(searchParams.redirectTo)

  return (
    <main className="py-mc-32 sm:py-mc-48">
      <PageContainer>
        <PageHeader
          title="Completar cadastro esportivo"
          description="Escolha uma equipe já existente da organização, informe faixa, peso e gênero. Depois você usa o fluxo de fazer a própria inscrição."
        />

        {scope.mode !== 'restricted' ? (
          <Alert variant="warning" role="status" className="mt-mc-24">
            O cadastro esportivo depende da organização desta release. Sem ela, não é possível selecionar equipe.
          </Alert>
        ) : null}

        {scope.mode === 'restricted' && !teams.length ? (
          <EmptyState
            icon={<UsersRound size={34} />}
            title="Cadastro esportivo incompleto"
            description="Ainda não há equipes nesta organização. Um professor ou o organizador precisa cadastrar a academia antes de você concluir. Não criamos equipe automaticamente."
            action={<Link href="/dashboard" className="font-mc-interface font-semibold text-mc-action hover:underline">Voltar ao painel</Link>}
            className="mt-mc-32 rounded-mc-medium border border-mc-border bg-mc-surface"
          />
        ) : null}

        {scope.mode === 'restricted' && teams.length ? (
          <Card className="mt-mc-32 p-mc-16 sm:p-mc-24">
            <CompleteSportsProfileForm
              teams={teams}
              nomeCompleto={profile?.nome_completo || actor.name}
              dataNascimento={profile?.data_nascimento || ''}
              redirectTo={redirectTo}
            />
          </Card>
        ) : null}
      </PageContainer>
    </main>
  )
}
