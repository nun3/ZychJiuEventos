'use client'

import { FormEvent, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
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

  return (
    <div className="space-y-mc-24">
      {feedback ? <Alert variant={feedback.ok ? 'success' : 'error'} role="status">{feedback.message}</Alert> : null}
      <form onSubmit={handleUpdate} className="grid gap-mc-16 md:grid-cols-2">
        <input type="hidden" name="athlete_id" value={athlete.id} />
        <FormField id="edit-athlete-name" label="Nome completo" required>
          <Input name="nome" required minLength={3} defaultValue={athlete.nome} />
        </FormField>
        <FormField id="edit-athlete-cpf" label={<>CPF <span className="font-normal text-mc-text-secondary">(opcional)</span></>}>
          <Input name="cpf" defaultValue={athlete.cpf} inputMode="numeric" />
        </FormField>
        <FormField id="edit-athlete-birth" label="Nascimento" required>
          <Input name="data_nascimento" type="date" required defaultValue={athlete.nascimento} max={new Date().toISOString().slice(0, 10)} />
        </FormField>
        <FormField id="edit-athlete-gender" label="Gênero" required>
          <Select name="genero" required defaultValue={athlete.genero}>
            <option value="F">Feminino</option>
            <option value="M">Masculino</option>
            <option value="O">Outro</option>
          </Select>
        </FormField>
        <FormField id="edit-athlete-team" label="Equipe" required>
          <Select name="team_id" required value={teamId} onChange={(event) => setTeamId(event.target.value)}>
            {teams.map((team) => <option key={team.id} value={team.id}>{team.nome}</option>)}
          </Select>
        </FormField>
        <FormField id="edit-athlete-belt" label="Faixa" required>
          <Input name="faixa" required defaultValue={athlete.faixa} />
        </FormField>
        <FormField id="edit-athlete-weight" label="Peso (kg)" required>
          <Input name="peso_kg" type="number" min="1" max="300" step="0.01" required defaultValue={athlete.peso} />
        </FormField>
        <label className="flex min-h-11 items-center gap-mc-8 font-mc-interface text-sm text-mc-text-primary md:col-span-2">
          <input name="possui_necessidade_especial" type="checkbox" defaultChecked={athlete.necessidades} className="h-4 w-4 rounded border-mc-border text-mc-action focus:ring-mc-focus" />
          Possui necessidade especial
        </label>
        {teamChanged ? (
          <FormField id="edit-athlete-reason" label="Motivo da troca de equipe" required className="md:col-span-2" description="O motivo fica no histórico de auditoria.">
            <Input name="change_reason" required minLength={3} placeholder="Informe o motivo" />
          </FormField>
        ) : null}
        <div className="md:col-span-2">
          <Button type="submit" disabled={isPending}>{isPending ? 'Salvando...' : 'Salvar alterações'}</Button>
        </div>
      </form>
      {canSelfLink && !athlete.userId ? (
        <Alert variant="info">
          <p className="font-semibold">Atleta maior de idade</p>
          <p className="mt-mc-4">Vincule este cadastro à sua conta para representar o próprio atleta.</p>
          <Button type="button" variant="outline" disabled={isPending} onClick={handleLink} className="mt-mc-12">
            Vincular à minha conta
          </Button>
        </Alert>
      ) : null}
      {athlete.userId ? <Alert variant="success">Este atleta possui uma conta vinculada.</Alert> : null}
    </div>
  )
}
