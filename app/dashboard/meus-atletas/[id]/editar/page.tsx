import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
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

  return <div className="container mx-auto px-6 pb-12">
    <section className="overflow-hidden rounded-2xl bg-white shadow">
      <header className="bg-[#0C3049] px-6 py-6 text-white"><Link href="/dashboard/meus-atletas" className="text-sm text-blue-200 hover:text-white">← Voltar</Link><h1 className="mt-3 text-2xl font-bold uppercase">Editar {athlete.nome_completo}</h1></header>
      <div className="px-6 py-8"><EditAthleteForm athlete={{ id: athlete.id, nome: athlete.nome_completo, cpf: athlete.cpf || '', nascimento: athlete.data_nascimento, genero: athlete.genero, faixa: athlete.faixa, peso: athlete.peso_kg, teamId: athlete.team_id, necessidades: athlete.possui_necessidade_especial, userId: athlete.user_id }} teams={teams ?? []} canSelfLink={canSelfLink} />
        <section className="mt-10 border-t pt-6"><h2 className="text-lg font-bold uppercase text-gray-800">Histórico de troca de equipe</h2>{!auditLogs?.length ? <p className="mt-3 text-sm text-gray-500">Nenhuma troca registrada.</p> : <ul className="mt-3 space-y-2">{auditLogs.map((log) => <li key={log.id} className="rounded-lg bg-gray-50 p-3 text-sm"><strong>{new Date(log.created_at).toLocaleString('pt-BR')}</strong><span className="ml-2 text-gray-600">{log.reason}</span></li>)}</ul>}</section>
      </div>
    </section>
  </div>
}
