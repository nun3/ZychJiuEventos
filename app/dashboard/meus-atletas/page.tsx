import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Alert } from '@/components/ui/Alert'
import { PageContainer } from '@/components/ui/PageContainer'
import { PageHeader } from '@/components/ui/PageHeader'
import AthletesManager from './AthletesManager'

export default async function MeusAtletasPage() {
  const supabase = createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) redirect('/login?redirectTo=/dashboard/meus-atletas')

  const [{ data: membership }, { data: teams, error: teamsError }, { data: athletes, error: athletesError }] = await Promise.all([
    supabase.from('organization_members').select('organization_id').in('role', ['owner', 'organizer']).limit(1).maybeSingle(),
    supabase.from('teams').select('id, nome, created_by, organization_id').order('nome'),
    supabase.from('athletes').select('id, nome_completo, data_nascimento, faixa, peso_kg, teams(nome)').order('nome_completo'),
  ])

  if (teamsError || athletesError) {
    return (
      <main className="py-mc-32 sm:py-mc-48">
        <PageContainer>
          <PageHeader title="Atletas" description="Consulte os atletas e equipes disponíveis para a organização." />
          <Alert variant="error" role="alert" className="mt-mc-24">Não foi possível carregar os atletas. Tente novamente.</Alert>
        </PageContainer>
      </main>
    )
  }

  const teamItems = (teams ?? []).filter((team) => (
    team.created_by === authData.user.id
    || (membership != null && team.organization_id === membership.organization_id)
  )).map(({ id, nome }) => ({ id, nome }))
  const athleteItems = athletes ?? []

  return (
    <main className="py-mc-32 sm:py-mc-48">
      <PageContainer>
        <PageHeader title="Atletas" description="Gerencie sua equipe e os atletas vinculados a você." />
        <div className="mt-mc-32">
          <AthletesManager teams={teamItems} athletes={athleteItems.map((athlete) => ({ id: athlete.id, nome: athlete.nome_completo, dataNascimento: athlete.data_nascimento, faixa: athlete.faixa, peso: athlete.peso_kg, equipe: (athlete.teams as unknown as { nome: string } | null)?.nome || 'Sem equipe' }))} />
        </div>
      </PageContainer>
    </main>
  )
}
