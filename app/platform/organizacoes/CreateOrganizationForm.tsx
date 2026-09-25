'use client'

import { type FormEvent, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { createOrganizationWithOwner, type OrganizationActionResult } from './actions'

export default function CreateOrganizationForm() {
  const router = useRouter()
  const [feedback, setFeedback] = useState<OrganizationActionResult | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setFeedback(null)
    startTransition(async () => {
      const result = await createOrganizationWithOwner(data)
      setFeedback(result)
      if (result.ok && result.organizationId) {
        router.push(`/platform/organizacoes/${result.organizationId}`)
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-mc-16" aria-describedby={feedback ? 'create-org-feedback' : undefined}>
      {feedback ? (
        <Alert id="create-org-feedback" variant={feedback.ok ? 'success' : 'error'} role="status">
          {feedback.message}
        </Alert>
      ) : null}
      <FormField id="organization-name" label="Nome da organização" required>
        <Input name="nome" required minLength={2} autoComplete="organization" />
      </FormField>
      <FormField
        id="organization-owner-email"
        label="E-mail do proprietário"
        required
        description="O usuário precisa já ter conta. Não enviamos convite e não criamos senha."
      >
        <Input name="owner_email" type="email" required autoComplete="email" />
      </FormField>
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Criando...' : 'Criar organização'}
      </Button>
    </form>
  )
}
