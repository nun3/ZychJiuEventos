'use client'

import { type FormEvent, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Alert } from '@/components/ui/Alert'
import { BeltBadge } from '@/components/BeltBadge'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Select } from '@/components/ui/Select'
import { RECOGNIZED_BELT_NAMES } from '@/lib/categorization'
import { normalizeBelt } from '@/lib/athletes/belt'
import { updateMyBelt, type ProfileActionResult } from './actions'

const label = (name: string) => name.charAt(0).toUpperCase() + name.slice(1)

/** Faixa e graus de contas sem atleta vinculado (ex.: organizador). Aparece como a faixa circular do menu. */
export default function ProfileBeltForm({ faixa, grau }: { faixa: string | null; grau: number }) {
  const router = useRouter()
  const initial = normalizeBelt(faixa, grau)
  const [belt, setBelt] = useState(initial.belt)
  const [degrees, setDegrees] = useState(initial.grau)
  const [feedback, setFeedback] = useState<ProfileActionResult | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setFeedback(null)
    startTransition(async () => {
      const result = await updateMyBelt(data)
      setFeedback(result)
      if (result.ok) {
        window.dispatchEvent(new Event('meucamp:belt-updated'))
        router.refresh()
      }
    })
  }

  return (
    <section aria-labelledby="my-belt-title" className="rounded-mc-large border border-mc-border bg-mc-surface p-mc-16 sm:p-mc-24">
      <h2 id="my-belt-title" className="font-mc-display text-mc-h3 text-mc-text-primary">Minha faixa</h2>
      <p className="mt-mc-8 font-mc-interface text-sm text-mc-text-secondary">
        Aparece como a faixa circular no topo do menu. Sem faixa informada, vale a faixa branca.
      </p>
      <form onSubmit={handleSubmit} className="mt-mc-16 space-y-mc-16">
        {feedback ? <Alert variant={feedback.ok ? 'success' : 'error'} role="status">{feedback.message}</Alert> : null}
        <div className="flex flex-wrap items-end gap-mc-16">
          <BeltBadge belt={belt} grau={degrees} size={56} />
          <FormField id="my-belt" label="Faixa">
            <Select name="faixa" value={belt} onChange={(e) => setBelt(normalizeBelt(e.target.value).belt)}>
              {RECOGNIZED_BELT_NAMES.map((name) => <option key={name} value={name}>{label(name)}</option>)}
            </Select>
          </FormField>
          <FormField id="my-belt-grau" label="Graus">
            <Select name="grau" value={String(degrees)} onChange={(e) => setDegrees(normalizeBelt(belt, e.target.value).grau)}>
              <option value="0">Sem graus</option>
              <option value="1">1 grau</option>
              <option value="2">2 graus</option>
              <option value="3">3 graus</option>
              <option value="4">4 graus</option>
            </Select>
          </FormField>
          <Button type="submit" disabled={isPending}>{isPending ? 'Salvando...' : 'Salvar faixa'}</Button>
        </div>
      </form>
    </section>
  )
}
