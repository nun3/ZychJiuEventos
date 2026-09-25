'use client'

import { type FormEvent, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { addOrganizationMember, type MembershipActionResult } from './actions'

export default function AddMemberForm() {
  const router = useRouter()
  const [feedback, setFeedback] = useState<MembershipActionResult | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    setFeedback(null)
    startTransition(async () => {
      const result = await addOrganizationMember(data)
      setFeedback(result)
      if (result.ok) {
        form.reset()
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-mc-16" aria-describedby={feedback ? 'add-member-feedback' : undefined}>
      {feedback ? (
        <Alert id="add-member-feedback" variant={feedback.ok ? 'success' : 'error'} role="status">
          {feedback.message}
        </Alert>
      ) : null}
      <div className="grid gap-mc-16 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
        <FormField id="member-email" label="E-mail do usuário" required description="Somente conta já cadastrada.">
          <Input name="email" type="email" required autoComplete="email" />
        </FormField>
        <FormField id="member-role" label="Papel" required>
          <Select name="role" required defaultValue="organizer">
            <option value="organizer">Organizador</option>
            <option value="finance">Financeiro</option>
          </Select>
        </FormField>
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Adicionando...' : 'Adicionar membro'}
      </Button>
    </form>
  )
}
