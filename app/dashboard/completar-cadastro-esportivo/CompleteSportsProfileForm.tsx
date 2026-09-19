'use client'

import { useState, useTransition } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { completeSelfAthleteProfile, type SelfAthleteActionResult } from './actions'

export default function CompleteSportsProfileForm({
  teams,
  nomeCompleto,
  dataNascimento,
  redirectTo,
}: {
  teams: Array<{ id: string; nome: string }>
  nomeCompleto: string
  dataNascimento: string
  redirectTo: string
}) {
  const [feedback, setFeedback] = useState<SelfAthleteActionResult | null>(null)
  const [pending, startTransition] = useTransition()
  const maxBirth = new Date().toISOString().slice(0, 10)

  return (
    <form
      className="grid gap-mc-16 sm:grid-cols-2"
      action={(formData) => startTransition(async () => {
        setFeedback(null)
        const result = await completeSelfAthleteProfile(formData)
        setFeedback(result)
        if (result.ok) window.location.assign(redirectTo)
      })}
    >
      {feedback ? (
        <div className="sm:col-span-2">
          <Alert variant={feedback.ok ? 'success' : 'error'} role="status">{feedback.message}</Alert>
        </div>
      ) : null}
      <FormField id="self-athlete-name" label="Nome completo" required={!nomeCompleto}>
        {nomeCompleto ? (
          <Input value={nomeCompleto} readOnly />
        ) : (
          <Input name="nome_completo" required minLength={3} autoComplete="name" />
        )}
      </FormField>
      <FormField
        id="self-athlete-birth"
        label="Data de nascimento"
        required={!dataNascimento}
        description={dataNascimento ? 'Informada no cadastro da conta.' : 'Obrigatória e precisa comprovar 18 anos.'}
      >
        {dataNascimento ? (
          <Input value={dataNascimento} readOnly />
        ) : (
          <Input name="data_nascimento" type="date" required autoComplete="bday" max={maxBirth} />
        )}
      </FormField>
      <FormField id="self-athlete-team" label="Equipe" required className="sm:col-span-2">
        <Select name="team_id" required defaultValue="">
          <option value="">Selecione a academia</option>
          {teams.map((team) => <option key={team.id} value={team.id}>{team.nome}</option>)}
        </Select>
      </FormField>
      <FormField id="self-athlete-gender" label="Gênero" required>
        <Select name="genero" required defaultValue="">
          <option value="">Selecione</option>
          <option value="F">Feminino</option>
          <option value="M">Masculino</option>
          <option value="O">Outro</option>
        </Select>
      </FormField>
      <FormField id="self-athlete-belt" label="Faixa" required>
        <Input name="faixa" required placeholder="Ex.: Branca" />
      </FormField>
      <FormField id="self-athlete-weight" label="Peso (kg)" required>
        <Input name="peso_kg" type="number" min="1" max="300" step="0.01" required />
      </FormField>
      <label className="flex min-h-11 items-center gap-mc-8 font-mc-interface text-sm text-mc-text-primary sm:col-span-2">
        <input name="possui_necessidade_especial" type="checkbox" className="h-4 w-4 rounded border-mc-border text-mc-action focus:ring-mc-focus" />
        Possui necessidade especial
      </label>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>{pending ? 'Salvando...' : 'Concluir cadastro esportivo'}</Button>
      </div>
    </form>
  )
}
