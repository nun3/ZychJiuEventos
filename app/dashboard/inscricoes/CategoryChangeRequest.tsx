'use client'

import { useEffect, useState, useTransition } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Select } from '@/components/ui/Select'
import { listEligibleCategoryChanges, requestCategoryChange, type EligibleCategory } from './category-change-actions'

export default function CategoryChangeRequest({ registrationId }: { registrationId: string }) {
  const [categories, setCategories] = useState<EligibleCategory[] | null>(null)
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    void listEligibleCategoryChanges(registrationId).then((result) => {
      if (!cancelled) setCategories(result)
    })
    return () => { cancelled = true }
  }, [registrationId])

  if (!categories?.length) return null

  return (
    <form
      className="mt-mc-12 space-y-mc-12 rounded-mc-medium border border-mc-border bg-mc-surface-secondary p-mc-12"
      action={(formData) => startTransition(async () => {
        setMessage(null)
        const result = await requestCategoryChange(formData)
        setMessage({ ok: result.ok, text: result.message })
      })}
    >
      <input type="hidden" name="registration_id" value={registrationId} />
      <p className="font-mc-interface text-sm font-semibold text-mc-text-primary">Solicitar mudança de categoria</p>
      <FormField id={`category-change-${registrationId}`} label="Categoria elegível" required>
        <Select name="requested_category_id" required defaultValue="">
          <option value="" disabled>Selecione</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.nome}</option>)}
        </Select>
      </FormField>
      <FormField id={`category-reason-${registrationId}`} label="Motivo" required>
        <textarea id={`category-reason-${registrationId}`} name="reason" required minLength={5} rows={3} className="min-h-11 w-full rounded-mc-small border border-mc-border bg-mc-surface px-3 py-2 font-mc-interface text-base text-mc-text-primary focus:border-mc-focus focus:outline-none focus:ring-2 focus:ring-mc-focus/20" />
      </FormField>
      {message ? <Alert variant={message.ok ? 'success' : 'error'} role={message.ok ? 'status' : 'alert'}>{message.text}</Alert> : null}
      <Button type="submit" size="small" disabled={pending}>{pending ? 'Enviando…' : 'Enviar solicitação'}</Button>
    </form>
  )
}
