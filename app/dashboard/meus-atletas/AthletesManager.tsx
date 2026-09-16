'use client'

import { type FormEvent, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search, UserRound } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import {
  MobileRecord,
  MobileRecordActions,
  MobileRecordHeader,
  MobileRecordMeta,
  MobileRecordTitle,
} from '@/components/ui/MobileRecord'
import { Select } from '@/components/ui/Select'
import { createManagedAthlete, createTeam, type AthleteActionResult } from './actions'

export type TeamOption = { id: string; nome: string }
export type AthleteListItem = {
  id: string
  nome: string
  dataNascimento: string
  faixa: string
  peso: number
  equipe: string
}

function ageFromDate(date: string) {
  const birth = new Date(`${date}T12:00:00`)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age--
  return age
}

function AthleteLinks({ athleteId }: { athleteId: string }) {
  return (
    <div className="flex flex-wrap gap-mc-8">
      <Link href={`/dashboard/meus-atletas/${athleteId}/editar`} className="inline-flex min-h-11 items-center rounded-mc-medium border border-mc-border px-mc-12 font-mc-interface text-sm font-semibold text-mc-text-primary hover:bg-mc-surface-secondary">Editar</Link>
      <Link href={`/dashboard/meus-atletas/${athleteId}/inscricoes`} className="inline-flex min-h-11 items-center rounded-mc-medium bg-mc-action px-mc-12 font-mc-interface text-sm font-semibold text-white hover:bg-mc-action/90">Inscrições</Link>
    </div>
  )
}

export default function AthletesManager({ teams, athletes }: { teams: TeamOption[]; athletes: AthleteListItem[] }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [showTeamForm, setShowTeamForm] = useState(teams.length === 0)
  const [showAthleteForm, setShowAthleteForm] = useState(false)
  const [feedback, setFeedback] = useState<AthleteActionResult | null>(null)
  const [isPending, startTransition] = useTransition()
  const visibleAthletes = athletes.filter((athlete) => athlete.nome.toLowerCase().includes(query.toLowerCase()))

  const submit = (action: (data: FormData) => Promise<AthleteActionResult>) => (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    setFeedback(null)
    startTransition(async () => {
      const result = await action(data)
      setFeedback(result)
      if (result.ok) {
        form.reset()
        setShowTeamForm(false)
        setShowAthleteForm(false)
        router.refresh()
      }
    })
  }

  const columns: Array<DataTableColumn<AthleteListItem>> = [
    {
      key: 'name',
      header: 'Atleta',
      render: (athlete) => (
        <div className="min-w-56">
          <p className="font-semibold text-mc-text-primary">{athlete.nome}</p>
          <p className="mt-mc-4 text-xs text-mc-text-secondary">{ageFromDate(athlete.dataNascimento)} anos</p>
        </div>
      ),
    },
    { key: 'team', header: 'Equipe', render: (athlete) => <span className="font-medium">{athlete.equipe}</span> },
    { key: 'belt', header: 'Faixa', render: (athlete) => athlete.faixa },
    { key: 'weight', header: 'Peso', render: (athlete) => `${athlete.peso.toLocaleString('pt-BR')} kg` },
    { key: 'actions', header: 'Ações', render: (athlete) => <AthleteLinks athleteId={athlete.id} />, className: 'min-w-56' },
  ]

  return (
    <div className="space-y-mc-24">
      {feedback ? <Alert variant={feedback.ok ? 'success' : 'error'} role="status">{feedback.message}</Alert> : null}

      <div className="flex flex-col gap-mc-16 border-b border-mc-border pb-mc-24 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-mc-display text-mc-h2 text-mc-text-primary">Atletas cadastrados</h2>
          <p className="mt-mc-4 font-mc-interface text-sm text-mc-text-secondary">{athletes.length} {athletes.length === 1 ? 'atleta cadastrado' : 'atletas cadastrados'}</p>
        </div>
        <div className="flex flex-col gap-mc-8 sm:flex-row">
          <Button variant="outline" aria-expanded={showTeamForm} aria-controls="team-form" onClick={() => setShowTeamForm((value) => !value)}>Nova equipe</Button>
          <Button disabled={teams.length === 0} aria-expanded={showAthleteForm} aria-controls="athlete-form" onClick={() => setShowAthleteForm((value) => !value)} className="gap-mc-8"><Plus aria-hidden="true" size={18} />Novo atleta</Button>
        </div>
      </div>

      {showTeamForm ? (
        <Card id="team-form" variant="subtle" className="bg-mc-surface-secondary p-mc-16 sm:p-mc-24">
          <form onSubmit={submit(createTeam)} className="flex flex-col gap-mc-16 sm:flex-row sm:items-end">
            <FormField id="team-name" label="Nome da equipe" required className="flex-1">
              <Input name="nome" required minLength={2} placeholder="Ex.: Academia Central" />
            </FormField>
            <Button type="submit" disabled={isPending}>{isPending ? 'Salvando...' : 'Cadastrar equipe'}</Button>
          </form>
        </Card>
      ) : null}

      {showAthleteForm ? (
        <Card id="athlete-form" variant="subtle" className="bg-mc-surface-secondary p-mc-16 sm:p-mc-24">
          <form onSubmit={submit(createManagedAthlete)} className="grid gap-mc-16 md:grid-cols-2">
            <FormField id="athlete-name" label="Nome completo" required><Input name="nome" required minLength={3} /></FormField>
            <FormField id="athlete-cpf" label={<>CPF <span className="font-normal text-mc-text-secondary">(opcional)</span></>}><Input name="cpf" inputMode="numeric" /></FormField>
            <FormField id="athlete-birth-date" label="Nascimento" required><Input name="data_nascimento" type="date" required max={new Date().toISOString().slice(0, 10)} /></FormField>
            <FormField id="athlete-gender" label="Gênero" required>
              <Select name="genero" required><option value="">Selecione</option><option value="F">Feminino</option><option value="M">Masculino</option><option value="O">Outro</option></Select>
            </FormField>
            <FormField id="athlete-team" label="Equipe" required>
              <Select name="team_id" required><option value="">Selecione</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.nome}</option>)}</Select>
            </FormField>
            <FormField id="athlete-relationship" label="Vínculo" required>
              <Select name="relationship" required><option value="professor">Professor</option><option value="responsavel">Responsável</option></Select>
            </FormField>
            <FormField id="athlete-belt" label="Faixa" required><Input name="faixa" required placeholder="Ex.: Branca" /></FormField>
            <FormField id="athlete-weight" label="Peso (kg)" required><Input name="peso_kg" type="number" required min="1" max="300" step="0.01" /></FormField>
            <label className="flex min-h-11 items-center gap-mc-8 font-mc-interface text-sm text-mc-text-primary md:col-span-2"><input name="possui_necessidade_especial" type="checkbox" className="h-4 w-4 rounded border-mc-border text-mc-action focus:ring-mc-focus" />Possui necessidade especial</label>
            <div className="md:col-span-2"><Button type="submit" disabled={isPending}>{isPending ? 'Salvando...' : 'Cadastrar atleta'}</Button></div>
          </form>
        </Card>
      ) : null}

      <div className="relative">
        <label htmlFor="athlete-search" className="sr-only">Buscar atleta pelo nome</label>
        <Search aria-hidden="true" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mc-text-secondary" />
        <Input id="athlete-search" value={query} onChange={(event) => setQuery(event.target.value)} className="pl-10" placeholder="Buscar pelo nome" />
      </div>

      {visibleAthletes.length === 0 ? (
        <EmptyState
          icon={<UserRound size={34} />}
          title={athletes.length === 0 ? 'Nenhum atleta cadastrado' : 'Nenhum atleta encontrado'}
          description={athletes.length === 0 ? 'Os atletas cadastrados nesta organização aparecerão aqui.' : 'Tente buscar por outro nome.'}
          className="rounded-mc-medium border border-mc-border bg-mc-surface"
        />
      ) : (
        <>
          <DataTable
            rows={visibleAthletes}
            columns={columns}
            getRowKey={(athlete) => athlete.id}
            caption="Atletas cadastrados"
            className="hidden md:block"
            tableClassName="min-w-[800px]"
          />

          <div className="space-y-mc-12 md:hidden">
            {visibleAthletes.map((athlete) => (
              <MobileRecord key={athlete.id}>
                <MobileRecordHeader>
                  <div>
                    <MobileRecordTitle className="text-lg leading-6">{athlete.nome}</MobileRecordTitle>
                    <MobileRecordMeta>{ageFromDate(athlete.dataNascimento)} anos</MobileRecordMeta>
                  </div>
                </MobileRecordHeader>
                <dl className="mt-mc-16 grid grid-cols-2 gap-mc-12 border-y border-mc-border py-mc-12 font-mc-interface text-sm">
                  <div className="col-span-2"><dt className="text-mc-text-secondary">Equipe</dt><dd className="mt-mc-4 font-semibold text-mc-text-primary">{athlete.equipe}</dd></div>
                  <div><dt className="text-mc-text-secondary">Faixa</dt><dd className="mt-mc-4 font-semibold text-mc-text-primary">{athlete.faixa}</dd></div>
                  <div><dt className="text-mc-text-secondary">Peso</dt><dd className="mt-mc-4 font-semibold text-mc-text-primary">{athlete.peso.toLocaleString('pt-BR')} kg</dd></div>
                </dl>
                <MobileRecordActions><AthleteLinks athleteId={athlete.id} /></MobileRecordActions>
              </MobileRecord>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
