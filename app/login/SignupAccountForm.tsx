'use client'

import { useState, useTransition } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import type { SignupRole } from '@/lib/auth/signup-role'
import { registerPublicAccount, type SignupActionResult } from './actions'

const roleLabels: Record<SignupRole, string> = {
  atleta: 'Atleta',
  professor: 'Professor',
  organizador: 'Organizador',
  responsavel: 'Responsável',
}

export default function SignupAccountForm({
  role,
  onBack,
}: {
  role: SignupRole
  onBack: () => void
}) {
  const [feedback, setFeedback] = useState<SignupActionResult | null>(null)
  const [pending, startTransition] = useTransition()
  const maxBirth = new Date().toISOString().slice(0, 10)

  return (
    <form
      className="mt-mc-24 space-y-mc-16"
      action={(formData) => startTransition(async () => {
        setFeedback(null)
        setFeedback(await registerPublicAccount(formData))
      })}
    >
      <input type="hidden" name="tipo_cadastro" value={role} />
      <p className="font-mc-interface text-sm text-mc-text-secondary">
        Cadastro de {roleLabels[role].toLowerCase()}. Só maiores de 18 anos criam conta. Menor de idade é cadastrado por Professor ou Responsável em Meus Atletas.
      </p>
      {feedback ? (
        <Alert variant={feedback.ok ? 'success' : 'error'} role="status">{feedback.message}</Alert>
      ) : null}
      <FormField id="signup-name" label="Nome completo" required>
        <Input name="nome_completo" required minLength={3} autoComplete="name" />
      </FormField>
      <FormField id="signup-birth" label="Data de nascimento" required description="Obrigatória. A conta só é criada para quem já tem 18 anos.">
        <Input name="data_nascimento" type="date" required autoComplete="bday" max={maxBirth} />
      </FormField>
      <FormField id="signup-email" label="E-mail" required>
        <Input name="email" type="email" required autoComplete="email" placeholder="nome@exemplo.com" />
      </FormField>
      <FormField id="signup-password" label="Senha" required>
        <Input name="password" type="password" required minLength={8} autoComplete="new-password" />
      </FormField>
      <FormField id="signup-confirm" label="Confirmar senha" required>
        <Input name="confirm_password" type="password" required minLength={8} autoComplete="new-password" />
      </FormField>
      <Button type="submit" size="large" disabled={pending} className="w-full">
        {pending ? 'Enviando...' : 'Criar conta'}
      </Button>
      <button type="button" onClick={onBack} className="min-h-11 w-full font-mc-interface text-sm font-semibold text-mc-action hover:underline">
        Voltar aos tipos de cadastro
      </button>
    </form>
  )
}
