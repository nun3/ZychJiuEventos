'use client'

import { type FormEvent, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { PIX_KEY_TYPES, PIX_KEY_TYPE_LABELS, type PixKeyType } from '@/lib/finance/pix-key'
import { saveOrganizationPixSettings, type MembershipActionResult } from './actions'

const placeholders: Record<PixKeyType, string> = {
  cpf: '000.000.000-00',
  cnpj: '00.000.000/0000-00',
  email: 'financeiro@organizacao.com.br',
  telefone: '(41) 99999-0000',
  aleatoria: '123e4567-e89b-12d3-a456-426614174000',
}

const inputModes: Record<PixKeyType, 'numeric' | 'email' | 'tel' | 'text'> = {
  cpf: 'numeric',
  cnpj: 'numeric',
  email: 'email',
  telefone: 'tel',
  aleatoria: 'text',
}

export default function PixSettingsForm({
  initial,
}: {
  initial: { pixKeyType: PixKeyType; pixKey: string; recipientName: string } | null
}) {
  const router = useRouter()
  const [keyType, setKeyType] = useState<PixKeyType>(initial?.pixKeyType ?? 'cnpj')
  const [feedback, setFeedback] = useState<MembershipActionResult | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    setFeedback(null)
    startTransition(async () => {
      const result = await saveOrganizationPixSettings(data)
      setFeedback(result)
      if (result.ok) {
        const confirmation = form.elements.namedItem('confirmed')
        if (confirmation instanceof HTMLInputElement) confirmation.checked = false
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-mc-16" aria-describedby={feedback ? 'pix-settings-feedback' : undefined}>
      {feedback ? (
        <Alert id="pix-settings-feedback" variant={feedback.ok ? 'success' : 'error'} role={feedback.ok ? 'status' : 'alert'}>
          {feedback.message}
        </Alert>
      ) : null}
      <div className="grid gap-mc-16 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
        <FormField id="pix-key-type" label="Tipo da chave" required>
          <Select
            name="pix_key_type"
            required
            value={keyType}
            onChange={(event) => setKeyType(event.target.value as PixKeyType)}
          >
            {PIX_KEY_TYPES.map((type) => (
              <option key={type} value={type}>{PIX_KEY_TYPE_LABELS[type]}</option>
            ))}
          </Select>
        </FormField>
        <FormField id="pix-key" label="Chave PIX" required description="Use uma chave da conta que recebe as inscrições.">
          <Input
            name="pix_key"
            required
            maxLength={120}
            autoComplete="off"
            spellCheck={false}
            inputMode={inputModes[keyType]}
            placeholder={placeholders[keyType]}
            defaultValue={initial?.pixKey ?? ''}
          />
        </FormField>
      </div>
      <FormField id="pix-recipient" label="Nome do favorecido" required description="Exatamente como aparece para quem paga, para o atleta conferir antes de pagar.">
        <Input
          name="recipient_name"
          required
          minLength={3}
          maxLength={120}
          autoComplete="organization"
          defaultValue={initial?.recipientName ?? ''}
        />
      </FormField>
      <label className="flex items-start gap-mc-8 font-mc-interface text-sm text-mc-text-primary">
        <input type="checkbox" name="confirmed" value="yes" required className="mt-1 h-4 w-4 accent-mc-action" />
        Confirmo que esta chave pertence à organização e que conferi os dados. A alteração é registrada em auditoria.
      </label>
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Salvando...' : initial ? 'Atualizar PIX' : 'Salvar PIX'}
      </Button>
    </form>
  )
}
