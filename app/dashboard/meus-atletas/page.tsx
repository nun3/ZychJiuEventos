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

  const [{ data: teams, error: teamsError }, { data: athletes, error: athletesError }] = await Promise.all([
    supabase.from('teams').select('id, nome').order('nome'),
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

  const teamItems = teams ?? []
  const athleteItems = athletes ?? []

  return (
    <main className="py-mc-32 sm:py-mc-48">
      <PageContainer>
        <PageHeader title="Atletas" description="Consulte atletas, equipes e dados usados nas inscrições." />
        <div className="mt-mc-32">
          <AthletesManager teams={teamItems} athletes={athleteItems.map((athlete) => ({ id: athlete.id, nome: athlete.nome_completo, dataNascimento: athlete.data_nascimento, faixa: athlete.faixa, peso: athlete.peso_kg, equipe: (athlete.teams as unknown as { nome: string } | null)?.nome || 'Sem equipe' }))} />
        </div>
      </PageContainer>
    </main>
  )
}
