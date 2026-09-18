'use client'

import { useState, useTransition } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { createCategoryRuleSet } from '../../actions'

export default function CategoryManager({ eventId }: { eventId: string }) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  return (
    <form action={(data) => startTransition(async () => { const result = await createCategoryRuleSet(data); setMessage(result.message) })} className="grid gap-mc-16 rounded-mc-medium border border-mc-border bg-mc-surface p-mc-16 sm:p-mc-24 md:grid-cols-2">
      <input type="hidden" name="event_id" value={eventId} />
      <div className="md:col-span-2">
        <h2 className="font-mc-display text-mc-h2 text-mc-text-primary">Nova versão de categorias</h2>
        <p className="mt-mc-4 font-mc-interface text-sm text-mc-text-secondary">A criação preserva as versões anteriores do conjunto. A duração oficial da luta é operacional e pode ficar em branco.</p>
      </div>
      {message ? <Alert role="status" className="md:col-span-2">{message}</Alert> : null}
      <FormField id="rule-name" label="Nome do conjunto" required><Input name="rule_name" required placeholder="Categorias CBJJ" /></FormField>
      <FormField id="category-name" label="Nome da categoria" required><Input name="category_name" required placeholder="Adulto Branca Leve" /></FormField>
      <FormField id="category-gender" label="Gênero" required><Select name="genero"><option value="M">Masculino</option><option value="F">Feminino</option></Select></FormField>
      <div className="grid grid-cols-2 gap-mc-12">
        <FormField id="minimum-age" label="Idade mínima" required><Input name="idade_min" type="number" min="0" defaultValue="18" required /></FormField>
        <FormField id="maximum-age" label="Idade máxima" required><Input name="idade_max" type="number" min="0" defaultValue="29" required /></FormField>
      </div>
      <div className="grid grid-cols-2 gap-mc-12">
        <FormField id="minimum-belt" label="Faixa mínima" required><Input name="faixa_min" type="number" min="1" defaultValue="1" required /></FormField>
        <FormField id="maximum-belt" label="Faixa máxima" required><Input name="faixa_max" type="number" min="1" defaultValue="1" required /></FormField>
      </div>
      <div className="grid grid-cols-2 gap-mc-12">
        <FormField id="minimum-weight" label="Peso mínimo" required><Input name="peso_min" type="number" min="0" step="0.01" defaultValue="0" required /></FormField>
        <FormField id="maximum-weight" label="Peso máximo" required><Input name="peso_max" type="number" min="0" step="0.01" defaultValue="76" required /></FormField>
      </div>
      <FormField id="fight-duration" label="Duração da luta (minutos)">
        <Input name="fight_duration_minutes" type="number" inputMode="decimal" min="0.5" max="20" step="0.5" placeholder="Opcional" />
      </FormField>
      <Button type="submit" disabled={pending} size="large" className="md:col-span-2">{pending ? 'Criando...' : 'Criar versão'}</Button>
    </form>
  )
}
