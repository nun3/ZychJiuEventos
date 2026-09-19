import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { PageContainer } from '@/components/ui/PageContainer'
import { PageHeader } from '@/components/ui/PageHeader'
import EditAthleteForm from './EditAthleteForm'

export default async function EditAthletePage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: athlete } = await supabase.from('athletes').select('*').eq('id', params.id).maybeSingle()
  if (!athlete) notFound()

  const [{ data: teams }, { data: auditLogs }] = await Promise.all([
    supabase.from('teams').select('id, nome').eq('organization_id', athlete.organization_id).order('nome'),
    supabase.from('event_audit_logs').select('id, created_at, reason, before_data, after_data').eq('resource_id', athlete.id).eq('action', 'athlete.team_changed').order('created_at', { ascending: false }),
  ])
  const eighteenYearsAgo = new Date()
  eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18)
  const canSelfLink = new Date(`${athlete.data_nascimento}T12:00:00`) <= eighteenYearsAgo

  return (
    <main className="py-mc-32 sm:py-mc-48">
      <PageContainer>
        <PageHeader
          title={`Editar ${athlete.nome_completo}`}
          description="Atualize os dados do atleta. A equipe, a faixa e o peso entram nas próximas inscrições."
          breadcrumb={<Link href="/dashboard/meus-atletas" className="font-semibold text-mc-action hover:underline">Voltar para atletas</Link>}
          actions={<Link href={`/dashboard/meus-atletas/${athlete.id}/inscricoes`} className="inline-flex min-h-11 items-center font-mc-interface text-sm font-semibold text-mc-action hover:underline">Ver inscrições</Link>}
        />
        <Card className="mt-mc-32 p-mc-16 sm:p-mc-24">
          <EditAthleteForm
            athlete={{
              id: athlete.id,
              nome: athlete.nome_completo,
              cpf: athlete.cpf || '',
              nascimento: athlete.data_nascimento,
              genero: athlete.genero,
              faixa: athlete.faixa,
              peso: athlete.peso_kg,
              teamId: athlete.team_id,
              necessidades: athlete.possui_necessidade_especial,
              userId: athlete.user_id,
            }}
            teams={teams ?? []}
            canSelfLink={canSelfLink}
          />
        </Card>
        <section className="mt-mc-32" aria-labelledby="team-history-title">
          <h2 id="team-history-title" className="font-mc-display text-mc-h3 text-mc-text-primary">Histórico de troca de equipe</h2>
          {!auditLogs?.length ? (
            <p className="mt-mc-12 font-mc-interface text-sm text-mc-text-secondary">Nenhuma troca de equipe registrada para este atleta.</p>
          ) : (
            <ul className="mt-mc-16 divide-y divide-mc-border overflow-hidden rounded-mc-medium border border-mc-border bg-mc-surface">
              {auditLogs.map((log) => (
                <li key={log.id} className="px-mc-16 py-mc-12 font-mc-interface text-sm">
                  <strong className="text-mc-text-primary">{new Date(log.created_at).toLocaleString('pt-BR')}</strong>
                  <span className="mt-mc-4 block text-mc-text-secondary">{log.reason}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </PageContainer>
    </main>
  )
}
