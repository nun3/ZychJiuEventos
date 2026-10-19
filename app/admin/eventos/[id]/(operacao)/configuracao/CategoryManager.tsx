'use client'

import { useRef, useState, useTransition } from 'react'
import { Layers3, Plus } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { RECOGNIZED_BELTS } from '@/lib/registrations/correction'
import { createCategoryRuleSet } from '../../../actions'

type CatalogDefinition = {
  id: string
  nome: string
  divisao_etaria: string
  genero: string
  peso_min_kg: number
  peso_max_kg: number | null
}

const beltOptions = RECOGNIZED_BELTS.map((label, index) => ({
  value: String(index + 1),
  label,
}))

export default function CategoryManager({
  eventId,
  catalog,
}: {
  eventId: string
  catalog: { id: string; nome: string; versao: number; definitions: CatalogDefinition[] } | null
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState('')

  function clearForm() {
    formRef.current?.reset()
    setMessage('')
  }

  return (
    <form
      ref={formRef}
      action={(data) => startTransition(async () => {
        const result = await createCategoryRuleSet(data)
        setMessage(result.message)
        if (result.ok) formRef.current?.reset()
      })}
      className="min-w-0 overflow-hidden rounded-mc-medium border border-mc-border bg-mc-surface shadow-mc-subtle"
    >
      <input type="hidden" name="event_id" value={eventId} />
      {catalog ? <input type="hidden" name="category_catalog_id" value={catalog.id} /> : null}

      <header className="border-b border-mc-border p-mc-16 sm:p-mc-24">
        <div className="flex items-start gap-mc-12">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-mc-medium bg-mc-action/10 text-mc-action" aria-hidden="true">
            <Layers3 size={20} />
          </span>
          <div>
            <h2 className="font-mc-display text-mc-h3 text-mc-text-primary">Nova versão de categorias</h2>
            <p className="mt-mc-4 font-mc-interface text-sm text-mc-text-secondary">
              A criação preserva as versões anteriores.{' '}
              {catalog
                ? `Catálogo oficial: ${catalog.nome} v${catalog.versao}.`
                : 'Modo legado: nenhum catálogo oficial disponível.'}
            </p>
          </div>
        </div>
      </header>

      <div className="space-y-mc-24 p-mc-16 sm:p-mc-24">
        {message ? <Alert role="status">{message}</Alert> : null}

        <fieldset className="min-w-0 space-y-mc-16">
          <legend className="font-mc-interface text-xs font-semibold uppercase tracking-wide text-mc-text-secondary">
            Identificação
          </legend>
          <div className="grid min-w-0 gap-mc-16 sm:grid-cols-2">
            <FormField id="rule-name" label="Nome do conjunto" required>
              <Input name="rule_name" required placeholder="Categorias CBJJ" />
            </FormField>
            <FormField id="category-name" label="Nome da categoria" required>
              <Input name="category_name" required placeholder="Adulto Branca Leve" />
            </FormField>
            {catalog ? (
              <FormField
                id="catalog-category"
                label="Categoria teórica vinculada"
                className="min-w-0 sm:col-span-2"
                description="Opcional. Deixe sem vínculo para uma categoria customizada."
              >
                <Select name="catalog_category_id" defaultValue="">
                  <option value="">Categoria customizada</option>
                  {catalog.definitions.map((definition) => (
                    <option key={definition.id} value={definition.id}>
                      {definition.divisao_etaria} · {definition.genero} · {definition.nome} ·{' '}
                      {definition.peso_max_kg == null ? 'sem limite' : `até ${definition.peso_max_kg} kg`}
                    </option>
                  ))}
                </Select>
              </FormField>
            ) : null}
          </div>
        </fieldset>

        <fieldset className="min-w-0 space-y-mc-16 border-t border-mc-border pt-4">
          <legend className="font-mc-interface text-xs font-semibold uppercase tracking-wide text-mc-text-secondary">
            Elegibilidade
          </legend>
          <div className="grid gap-mc-16 sm:grid-cols-2">
            <FormField id="category-gender" label="Gênero" required>
              <Select name="genero" defaultValue="M">
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </Select>
            </FormField>
            <div className="grid grid-cols-2 gap-mc-12 sm:col-span-2">
              <FormField id="minimum-age" label="Idade mínima" required>
                <Input name="idade_min" type="number" min="0" defaultValue="18" required />
              </FormField>
              <FormField id="maximum-age" label="Idade máxima" required>
                <Input name="idade_max" type="number" min="0" defaultValue="29" required />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-mc-12 sm:col-span-2">
              <FormField id="minimum-belt" label="Faixa mínima" required>
                <Select name="faixa_min" defaultValue="1" required>
                  {beltOptions.map((belt) => (
                    <option key={belt.value} value={belt.value}>{belt.label}</option>
                  ))}
                </Select>
              </FormField>
              <FormField id="maximum-belt" label="Faixa máxima" required>
                <Select name="faixa_max" defaultValue="1" required>
                  {beltOptions.map((belt) => (
                    <option key={belt.value} value={belt.value}>{belt.label}</option>
                  ))}
                </Select>
              </FormField>
            </div>
          </div>
        </fieldset>

        <fieldset className="min-w-0 space-y-mc-16 border-t border-mc-border pt-4">
          <legend className="font-mc-interface text-xs font-semibold uppercase tracking-wide text-mc-text-secondary">
            Peso
          </legend>
          <div className="grid gap-mc-16 sm:grid-cols-2">
            <div className="grid grid-cols-2 gap-mc-12 sm:col-span-2">
              <FormField id="minimum-weight" label="Peso mínimo (kg)" required>
                <Input name="peso_min" type="number" min="0" step="0.01" defaultValue="0" required />
              </FormField>
              <FormField id="maximum-weight" label="Peso máximo (kg)" required>
                <Input name="peso_max" type="number" min="0" step="0.01" defaultValue="76" required />
              </FormField>
            </div>
          </div>
        </fieldset>

        <fieldset className="min-w-0 space-y-mc-16 border-t border-mc-border pt-4">
          <legend className="font-mc-interface text-xs font-semibold uppercase tracking-wide text-mc-text-secondary">
            Luta
          </legend>
          <div className="grid gap-mc-16 sm:grid-cols-2">
            <FormField id="fight-duration" label="Duração da luta (min)" description="Opcional. Pode ser ajustada depois sem nova versão.">
              <Input
                name="fight_duration_minutes"
                type="number"
                inputMode="decimal"
                min="0.5"
                max="20"
                step="0.5"
                placeholder="Ex.: 5"
              />
            </FormField>
          </div>
        </fieldset>
      </div>

      <footer className="flex flex-col-reverse gap-mc-12 border-t border-mc-border bg-mc-surface-secondary p-mc-16 sm:flex-row sm:items-center sm:justify-end sm:p-mc-24">
        <Button type="button" variant="outline" onClick={clearForm} disabled={pending}>
          Limpar
        </Button>
        <Button type="submit" disabled={pending} className="gap-mc-8">
          <Plus aria-hidden="true" size={16} />
          {pending ? 'Criando…' : 'Criar versão'}
        </Button>
      </footer>
    </form>
  )
}
