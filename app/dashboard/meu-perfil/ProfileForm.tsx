'use client'

import { type FormEvent, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { updateMyProfile, type ProfileActionResult } from './actions'

export default function ProfileForm({
  nomeCompleto,
  telefone,
  dataNascimento,
}: {
  nomeCompleto: string
  telefone: string
  dataNascimento: string
}) {
  const router = useRouter()
  const [feedback, setFeedback] = useState<ProfileActionResult | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setFeedback(null)
    startTransition(async () => {
      const result = await updateMyProfile(data)
      setFeedback(result)
      if (result.ok) router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-mc-16">
      {feedback ? <Alert variant={feedback.ok ? 'success' : 'error'} role="status">{feedback.message}</Alert> : null}
      <div className="grid gap-mc-16 sm:grid-cols-2">
        <FormField id="profile-name" label="Nome completo" required className="sm:col-span-2">
          <Input name="nome_completo" required minLength={3} defaultValue={nomeCompleto} autoComplete="name" />
        </FormField>
        <FormField id="profile-phone" label="Telefone" description="Usado para contato operacional da conta.">
          <Input name="telefone" type="tel" defaultValue={telefone} autoComplete="tel" placeholder="(00) 00000-0000" />
        </FormField>
        <FormField id="profile-birth" label="Data de nascimento">
          <Input name="data_nascimento" type="date" defaultValue={dataNascimento} autoComplete="bday" max={new Date().toISOString().slice(0, 10)} />
        </FormField>
      </div>
      <Button type="submit" disabled={isPending}>{isPending ? 'Salvando...' : 'Salvar alterações'}</Button>
    </form>
  )
}
