'use client'

import { useRef, useState, useTransition, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import {
  competitiveGenderLabel,
  deriveCategoryFormStateFromCatalog,
  formatCatalogCategoryDefaultName,
  INITIAL_CUSTOM_CATEGORY_STATE,
  validateCategoryInputAgainstCatalog,
  type CatalogCategoryDefinition,
  type CategoryFormState,
} from '@/lib/events/catalog-category-sync'
import { RECOGNIZED_BELTS } from '@/lib/registrations/correction'
import { createCategoryRuleSet } from '../../../actions'

const beltOptions = RECOGNIZED_BELTS.map((label, index) => ({
  value: String(index + 1),
  label,
}))

export default function CategoryManager({
  eventId,
  catalog,
}: {
  eventId: string
  catalog: { id: string; nome: string; versao: number; definitions: CatalogCategoryDefinition[] } | null
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const submitLock = useRef(false)
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [ruleName, setRuleName] = useState('')
  const [fightDuration, setFightDuration] = useState('')
  const [fields, setFields] = useState<CategoryFormState>(INITIAL_CUSTOM_CATEGORY_STATE)
  const [lastAutoName, setLastAutoName] = useState('')

  const selectedDefinition = catalog?.definitions.find((item) => item.id === fields.catalogCategoryId) || null

  function patchFields(partial: Partial<CategoryFormState>) {
    setFields((current) => ({ ...current, ...partial }))
  }

  function handleCatalogSelect(nextCatalogCategoryId: string) {
    setMessage(null)
    if (!nextCatalogCategoryId) {
      const shouldClearAutoName = !fields.categoryName.trim() || fields.categoryName.trim() === lastAutoName.trim()
      setFields({
        ...INITIAL_CUSTOM_CATEGORY_STATE,
        categoryName: shouldClearAutoName ? '' : fields.categoryName,
      })
      setLastAutoName('')
      return
    }
    const definition = catalog?.definitions.find((item) => item.id === nextCatalogCategoryId)
    if (!definition) return
    const nextState = deriveCategoryFormStateFromCatalog(definition, fields.categoryName, lastAutoName)
    setFields(nextState)
    setLastAutoName(formatCatalogCategoryDefaultName(definition))
  }

  function clearForm() {
    formRef.current?.reset()
    setRuleName('')
    setFightDuration('')
    setFields(INITIAL_CUSTOM_CATEGORY_STATE)
    setLastAutoName('')
    setMessage(null)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending || submitLock.current) return
    const form = event.currentTarget
    const validation = validateCategoryInputAgainstCatalog(
      {
        categoryName: fields.categoryName,
        genero: fields.genero,
        idadeMinRaw: fields.idadeMin,
        idadeMaxRaw: fields.idadeMax,
        faixaMinRaw: fields.faixaMin,
        faixaMaxRaw: fields.faixaMax,
        pesoMinRaw: fields.pesoMin,
        pesoMaxRaw: fields.pesoMax,
      },
      selectedDefinition,
    )
    if (!validation.ok) {
      setMessage({ ok: false, text: validation.message })
      return
    }
    submitLock.current = true
    const data = new FormData(form)
    startTransition(async () => {
      try {
        const result = await createCategoryRuleSet(data)
        setMessage({ ok: result.ok, text: result.message })
        if (result.ok) {
          formRef.current?.reset()
          setRuleName('')
          setFightDuration('')
          setFields(INITIAL_CUSTOM_CATEGORY_STATE)
          setLastAutoName('')
        }
      } finally {
        submitLock.current = false
      }
    })
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="min-w-0 overflow-hidden border border-mc-border bg-mc-surface"
    >
      <input type="hidden" name="event_id" value={eventId} />
      {catalog ? <input type="hidden" name="category_catalog_id" value={catalog.id} /> : null}

      <header className="border-b border-mc-border p-mc-16 sm:p-mc-24">
        <h2 className="font-mc-display text-mc-h3 text-mc-text-primary">Nova versão de categorias</h2>
        <p className="mt-mc-4 font-mc-interface text-sm text-mc-text-secondary">
          A criação preserva as versões anteriores.{' '}
          {catalog
            ? `Catálogo oficial: ${catalog.nome} v${catalog.versao}.`
            : 'Modo legado: nenhum catálogo oficial disponível.'}
        </p>
      </header>

      <div className="space-y-mc-24 p-mc-16 sm:p-mc-24">
        {message ? (
          <Alert variant={message.ok ? 'success' : 'error'} role={message.ok ? 'status' : 'alert'}>
            {message.text}
          </Alert>
        ) : null}

        <fieldset className="min-w-0 space-y-mc-16">
          <legend className="font-mc-interface text-xs font-semibold uppercase tracking-wide text-mc-text-secondary">
            Identificação
          </legend>
          <div className="grid min-w-0 gap-mc-16 sm:grid-cols-2">
            <FormField id="rule-name" label="Nome do conjunto" required>
              <Input
                name="rule_name"
                required
                placeholder="Categorias CBJJ"
                value={ruleName}
                onChange={(event) => setRuleName(event.target.value)}
              />
            </FormField>
            <FormField id="category-name" label="Nome da categoria" required>
              <Input
                name="category_name"
                required
                placeholder="Adulto Branca Leve"
                value={fields.categoryName}
                onChange={(event) => patchFields({ categoryName: event.target.value })}
              />
            </FormField>
            {catalog ? (
              <FormField
                id="catalog-category"
                label="Categoria teórica vinculada"
                className="min-w-0 sm:col-span-2"
                description={
                  selectedDefinition
                    ? `Vinculada a ${selectedDefinition.divisao_etaria} · ${competitiveGenderLabel(selectedDefinition.genero)} · ${selectedDefinition.nome} (${selectedDefinition.peso_min_kg} kg ${selectedDefinition.peso_max_kg == null ? 'sem limite máximo fixo' : `a ${selectedDefinition.peso_max_kg} kg`}).`
                    : 'Opcional. Deixe sem vínculo para uma categoria customizada.'
                }
              >
                <Select
                  name="catalog_category_id"
                  value={fields.catalogCategoryId}
                  onChange={(event) => handleCatalogSelect(event.target.value)}
                >
                  <option value="">Categoria customizada</option>
                  {catalog.definitions.map((definition) => (
                    <option key={definition.id} value={definition.id}>
                      {definition.divisao_etaria} · {competitiveGenderLabel(definition.genero)} · {definition.nome} ·{' '}
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
            {selectedDefinition?.genero === 'U' ? (
              <p className="font-mc-interface text-sm text-mc-text-secondary sm:col-span-2">
                Esta definição guarda idade, faixa e peso compartilhados. A versão cria duas categorias efetivas, Masculino e Feminino, com os mesmos limites e chaves separadas.
              </p>
            ) : (
              <FormField id="category-gender" label="Gênero" required>
                <Select
                  name="genero"
                  value={fields.genero}
                  onChange={(event) => patchFields({ genero: event.target.value })}
                >
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </Select>
              </FormField>
            )}
            <div className="grid grid-cols-2 gap-mc-12 sm:col-span-2">
              <FormField id="minimum-age" label="Idade mínima" required>
                <Input
                  name="idade_min"
                  type="number"
                  min="0"
                  value={fields.idadeMin}
                  onChange={(event) => patchFields({ idadeMin: event.target.value })}
                  required
                />
              </FormField>
              <FormField
                id="maximum-age"
                label="Idade máxima"
                required
                description={
                  selectedDefinition && selectedDefinition.idade_max == null
                    ? 'A divisão ADULTO/MASTER não possui teto fixo no catálogo; informe a idade máxima do evento.'
                    : undefined
                }
              >
                <Input
                  name="idade_max"
                  type="number"
                  min="0"
                  placeholder={selectedDefinition && selectedDefinition.idade_max == null ? 'Informe a idade máxima' : undefined}
                  value={fields.idadeMax}
                  onChange={(event) => patchFields({ idadeMax: event.target.value })}
                  required
                />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-mc-12 sm:col-span-2">
              <FormField id="minimum-belt" label="Faixa mínima" required>
                <Select
                  name="faixa_min"
                  value={fields.faixaMin}
                  onChange={(event) => patchFields({ faixaMin: event.target.value })}
                  required
                >
                  {beltOptions.map((belt) => (
                    <option key={belt.value} value={belt.value}>{belt.label}</option>
                  ))}
                </Select>
              </FormField>
              <FormField id="maximum-belt" label="Faixa máxima" required>
                <Select
                  name="faixa_max"
                  value={fields.faixaMax}
                  onChange={(event) => patchFields({ faixaMax: event.target.value })}
                  required
                >
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
                <Input
                  name="peso_min"
                  type="number"
                  min="0"
                  step="0.01"
                  value={fields.pesoMin}
                  onChange={(event) => patchFields({ pesoMin: event.target.value })}
                  required
                />
              </FormField>
              <FormField
                id="maximum-weight"
                label="Peso máximo (kg)"
                required
                description={
                  selectedDefinition && selectedDefinition.peso_max_kg == null
                    ? 'Categoria sem teto fixo no catálogo; informe o peso máximo operacional.'
                    : undefined
                }
              >
                <Input
                  name="peso_max"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={selectedDefinition && selectedDefinition.peso_max_kg == null ? 'Informe o teto (kg)' : undefined}
                  value={fields.pesoMax}
                  onChange={(event) => patchFields({ pesoMax: event.target.value })}
                  required
                />
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
                value={fightDuration}
                onChange={(event) => setFightDuration(event.target.value)}
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
