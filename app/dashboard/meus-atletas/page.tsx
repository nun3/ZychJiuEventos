import { redirect } from 'next/navigation'
import { getPublicOrganizationScope } from '@/lib/events/public-organization'
import { createClient } from '@/lib/supabase/server'
import { Alert } from '@/components/ui/Alert'
import { PageContainer } from '@/components/ui/PageContainer'
import { PageHeader } from '@/components/ui/PageHeader'
import AthletesManager from './AthletesManager'

export default async function MeusAtletasPage() {
  const supabase = createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) redirect('/login?redirectTo=/dashboard/meus-atletas')

  const scope = getPublicOrganizationScope()
  const releaseOrganizationId = scope.mode === 'restricted' ? scope.organizationId : null
  let teamsQuery = supabase.from('teams').select('id, nome, created_by, organization_id').order('nome')
  let athletesQuery = supabase.from('athletes').select('id, nome_completo, data_nascimento, faixa, peso_kg, organization_id, teams(nome)').order('nome_completo')
  if (releaseOrganizationId) {
    teamsQuery = teamsQuery.eq('organization_id', releaseOrganizationId)
    athletesQuery = athletesQuery.eq('organization_id', releaseOrganizationId)
  }

  const [{ data: membership }, { data: teams, error: teamsError }, { data: athletes, error: athletesError }] = await Promise.all([
    releaseOrganizationId
      ? Promise.resolve({ data: { organization_id: releaseOrganizationId } })
      : supabase.from('organization_members').select('organization_id').in('role', ['owner', 'organizer']).limit(1).maybeSingle(),
    teamsQuery,
    athletesQuery,
  ])

  if (scope.mode === 'blocked' || teamsError || athletesError) {
    return (
      <main className="py-mc-32 sm:py-mc-48">
        <PageContainer>
          <PageHeader title="Meus atletas" description="Consulte os atletas e equipes que você gerencia." />
          <Alert variant="error" role="alert" className="mt-mc-24">
            {scope.mode === 'blocked'
              ? 'O contexto da organização da release está indisponível.'
              : 'Não foi possível carregar os atletas. Tente novamente.'}
          </Alert>
        </PageContainer>
      </main>
    )
  }

  const teamItems = (teams ?? []).filter((team) => (
    releaseOrganizationId
      ? team.organization_id === releaseOrganizationId
      : team.created_by === authData.user.id
        || (membership != null && team.organization_id === membership.organization_id)
  )).map(({ id, nome }) => ({ id, nome }))
  const athleteItems = (athletes ?? []).filter((athlete) => (
    !releaseOrganizationId || athlete.organization_id === releaseOrganizationId
  ))

  return (
    <main className="py-mc-32 sm:py-mc-48">
      <PageContainer>
        <PageHeader title="Meus atletas" description="Veja quem você gerencia, a equipe de cada atleta e as ações de edição e inscrição." />
        <div className="mt-mc-32">
          <AthletesManager teams={teamItems} athletes={athleteItems.map((athlete) => ({ id: athlete.id, nome: athlete.nome_completo, dataNascimento: athlete.data_nascimento, faixa: athlete.faixa, peso: athlete.peso_kg, equipe: (athlete.teams as unknown as { nome: string } | null)?.nome || 'Sem equipe' }))} />
        </div>
      </PageContainer>
    </main>
  )
}
