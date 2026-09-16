'use client'

import { FormEvent, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { AthleteActionResult } from '../../actions'
import { linkAthleteToCurrentUser, updateManagedAthlete } from '../../actions'

type Athlete = {
  id: string
  nome: string
  cpf: string
  nascimento: string
  genero: string
  faixa: string
  peso: number
  teamId: string
  necessidades: boolean
  userId: string | null
}

export default function EditAthleteForm({ athlete, teams, canSelfLink }: { athlete: Athlete; teams: { id: string; nome: string }[]; canSelfLink: boolean }) {
  const router = useRouter()
  const [feedback, setFeedback] = useState<AthleteActionResult | null>(null)
  const [teamId, setTeamId] = useState(athlete.teamId)
  const [isPending, startTransition] = useTransition()
  const teamChanged = teamId !== athlete.teamId

  const handleUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    startTransition(async () => {
      const result = await updateManagedAthlete(data)
      setFeedback(result)
      if (result.ok) router.refresh()
    })
  }

  const handleLink = () => startTransition(async () => {
    const result = await linkAthleteToCurrentUser(athlete.id)
    setFeedback(result)
    if (result.ok) router.refresh()
  })

  return <div className="space-y-6">
    {feedback && <p role="status" className={`rounded-lg border px-4 py-3 text-sm ${feedback.ok ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{feedback.message}</p>}
    <form onSubmit={handleUpdate} className="grid gap-4 md:grid-cols-2">
      <input type="hidden" name="athlete_id" value={athlete.id} />
      <label className="text-sm font-semibold">Nome completo<input name="nome" required minLength={3} defaultValue={athlete.nome} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
      <label className="text-sm font-semibold">CPF <span className="font-normal text-gray-400">(opcional)</span><input name="cpf" defaultValue={athlete.cpf} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
      <label className="text-sm font-semibold">Nascimento<input name="data_nascimento" type="date" required defaultValue={athlete.nascimento} max={new Date().toISOString().slice(0, 10)} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
      <label className="text-sm font-semibold">Gênero<select name="genero" required defaultValue={athlete.genero} className="mt-1 w-full rounded-lg border px-3 py-2"><option value="F">Feminino</option><option value="M">Masculino</option><option value="O">Outro</option></select></label>
      <label className="text-sm font-semibold">Equipe<select name="team_id" required value={teamId} onChange={(event) => setTeamId(event.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2">{teams.map((team) => <option key={team.id} value={team.id}>{team.nome}</option>)}</select></label>
      <label className="text-sm font-semibold">Faixa<input name="faixa" required defaultValue={athlete.faixa} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
      <label className="text-sm font-semibold">Peso (kg)<input name="peso_kg" type="number" min="1" max="300" step="0.01" required defaultValue={athlete.peso} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
      <label className="flex items-center gap-2 text-sm"><input name="possui_necessidade_especial" type="checkbox" defaultChecked={athlete.necessidades} /> Possui necessidade especial</label>
      {teamChanged && <label className="text-sm font-semibold md:col-span-2">Motivo da troca de equipe<input name="change_reason" required minLength={3} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="Informe o motivo para a auditoria" /></label>}
      <div className="flex gap-3 md:col-span-2"><button disabled={isPending} className="rounded-lg bg-primary-blue px-6 py-2 font-semibold text-white disabled:opacity-50">{isPending ? 'Salvando...' : 'Salvar alterações'}</button></div>
    </form>
    {canSelfLink && !athlete.userId && <div className="rounded-xl border border-blue-200 bg-blue-50 p-4"><h2 className="font-semibold text-blue-900">Atleta maior de idade</h2><p className="mt-1 text-sm text-blue-700">Vincule este cadastro à sua conta para representar o próprio atleta.</p><button type="button" disabled={isPending} onClick={handleLink} className="mt-3 rounded-lg border border-primary-blue px-4 py-2 text-sm font-semibold text-primary-blue">Vincular à minha conta</button></div>}
    {athlete.userId && <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">Este atleta possui uma conta vinculada.</p>}
  </div>
}
