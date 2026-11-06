'use client'

import { useMemo, useRef, useState, useTransition, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import {
  competitiveGenderLabel,
  definitionNeedsOverride,
  deriveCategoryFormStateFromCatalog,
  expandCatalogSelectionToCategoryRows,
  formatCatalogCategoryDefaultName,
  INITIAL_CUSTOM_CATEGORY_STATE,
  validateCategoryInputAgainstCatalog,
  type CatalogCategoryDefinition,
  type CatalogSelectionOverrides,
  type CategoryFormState,
} from '@/lib/events/catalog-category-sync'
import { RECOGNIZED_BELTS } from '@/lib/registrations/correction'
import { createCategoryRuleSet, createCategoryRuleSetFromCatalog } from '../../../actions'

const beltOptions = RECOGNIZED_BELTS.map((label, index) => ({
  value: String(index + 1),
  label,
}))

function groupByDivision(definitions: CatalogCategoryDefinition[]) {
  const groups: Array<{ label: string; items: CatalogCategoryDefinition[] }> = []
  for (const definition of definitions) {
    const last = groups[groups.length - 1]
    if (last && last.label === definition.divisao_etaria) {
      last.items.push(definition)
    } else {
      groups.push({ label: definition.divisao_etaria, items: [definition] })
    }
  }
  return groups
}

function weightLabel(definition: CatalogCategoryDefinition) {
  return definition.peso_max_kg == null ? `a partir de ${definition.peso_min_kg} kg` : `até ${definition.peso_max_kg} kg`
}

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
  const [mode, setMode] = useState<'catalog' | 'custom'>(catalog ? 'catalog' : 'custom')
  const [ruleName, setRuleName] = useState('')
  const [fightDuration, setFightDuration] = useState('')
  const [fields, setFields] = useState<CategoryFormState>(INITIAL_CUSTOM_CATEGORY_STATE)
  const [lastAutoName, setLastAutoName] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [overrides, setOverrides] = useState<CatalogSelectionOverrides>({})

  const selectedDefinition = catalog?.definitions.find((item) => item.id === fields.catalogCategoryId) || null
  const definitions = useMemo(() => catalog?.definitions || [], [catalog])
  const groups = useMemo(() => groupByDivision(definitions), [definitions])
  const allSelected = definitions.length > 0 && selectedIds.size === definitions.length

  const selectionPreview = useMemo(() => {
    if (mode !== 'catalog' || !selectedIds.size) return null
    const chosen = definitions.filter((definition) => selectedIds.has(definition.id))
    const duration = fightDuration.trim() ? Number(fightDuration.replace(',', '.')) : null
    return expandCatalogSelectionToCategoryRows(chosen, overrides, Number.isFinite(duration) ? duration : null)
  }, [mode, selectedIds, overrides, definitions, fightDuration])

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

  function toggleSelected(definitionId: string, checked: boolean) {
    setMessage(null)
    setSelectedIds((current) => {
      const next = new Set(current)
      if (checked) next.add(definitionId)
      else next.delete(definitionId)
      return next
    })
  }

  function toggleSelectAll(checked: boolean) {
    setMessage(null)
    setSelectedIds(checked ? new Set(definitions.map((definition) => definition.id)) : new Set())
  }

  function patchOverride(definitionId: string, partial: Partial<{ idadeMax: string; pesoMax: string }>) {
    setOverrides((current) => ({ ...current, [definitionId]: { ...current[definitionId], ...partial } }))
  }

  function clearForm() {
    formRef.current?.reset()
    setRuleName('')
    setFightDuration('')
    setFields(INITIAL_CUSTOM_CATEGORY_STATE)
    setLastAutoName('')
    setSelectedIds(new Set())
    setOverrides({})
    setMessage(null)
  }

  function handleCustomSubmit(form: HTMLFormElement) {
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
        if (result.ok) clearForm()
      } finally {
        submitLock.current = false
      }
    })
  }

  function handleCatalogSubmit(form: HTMLFormElement) {
    if (!selectedIds.size) {
      setMessage({ ok: false, text: 'Selecione ao menos uma categoria do catálogo.' })
      return
    }
    const chosen = definitions.filter((definition) => selectedIds.has(definition.id))
    const duration = fightDuration.trim() ? Number(fightDuration.replace(',', '.')) : null
    const validation = expandCatalogSelectionToCategoryRows(chosen, overrides, Number.isFinite(duration) ? duration : null)
    if (!validation.ok) {
      setMessage({ ok: false, text: validation.message })
      return
    }
    submitLock.current = true
    const data = new FormData(form)
    startTransition(async () => {
      try {
        const result = await createCategoryRuleSetFromCatalog(data)
        setMessage({ ok: result.ok, text: result.message })
        if (result.ok) clearForm()
      } finally {
        submitLock.current = false
      }
    })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending || submitLock.current) return
    if (mode === 'catalog' && catalog) handleCatalogSubmit(event.currentTarget)
    else handleCustomSubmit(event.currentTarget)
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
          <FormField id="rule-name" label="Nome do conjunto" required>
            <Input
              name="rule_name"
              required
              placeholder="Categorias CBJJ"
              value={ruleName}
              onChange={(event) => setRuleName(event.target.value)}
            />
          </FormField>
        </fieldset>

        {catalog ? (
          <Tabs value={mode} onValueChange={(value) => { setMessage(null); setMode(value as 'catalog' | 'custom') }}>
            <TabsList aria-label="Como montar esta versão de categorias">
              <TabsTrigger value="catalog">Selecionar do catálogo</TabsTrigger>
              <TabsTrigger value="custom">Categoria customizada</TabsTrigger>
            </TabsList>

            <TabsContent value="catalog" className="min-w-0 space-y-mc-16">
              <p className="font-mc-interface text-sm text-mc-text-secondary">
                Escolha quantas categorias teóricas precisar para este campeonato. Uma definição compartilhada (
                <strong>Parâmetros compartilhados</strong>) gera automaticamente as categorias masculina e feminina,
                com chaves separadas. Idade, faixa e peso vêm do catálogo; nada é inventado.
              </p>

              <label className="flex min-h-11 items-center gap-mc-8 border-b border-mc-border pb-3 font-mc-interface text-sm font-semibold text-mc-text-primary">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-mc-border text-mc-action focus:ring-mc-focus"
                  checked={allSelected}
                  onChange={(event) => toggleSelectAll(event.target.checked)}
                  aria-label="Selecionar todas as categorias do catálogo"
                />
                Selecionar todas ({definitions.length})
              </label>

              <div className="max-h-96 min-w-0 space-y-mc-16 overflow-y-auto pr-1">
                {groups.map((group) => (
                  <div key={group.label} className="min-w-0 space-y-mc-8">
                    <p className="font-mc-interface text-xs font-semibold uppercase tracking-wide text-mc-text-secondary">
                      {group.label}
                    </p>
                    <div className="space-y-mc-8">
                      {group.items.map((definition) => {
                        const needs = definitionNeedsOverride(definition)
                        const checked = selectedIds.has(definition.id)
                        return (
                          <div key={definition.id} className="min-w-0">
                            <label className="flex min-h-11 min-w-0 items-start gap-mc-8 font-mc-interface text-sm text-mc-text-primary">
                              <input
                                type="checkbox"
                                name="catalog_category_ids"
                                value={definition.id}
                                checked={checked}
                                onChange={(event) => toggleSelected(definition.id, event.target.checked)}
                                className="mt-1 h-4 w-4 shrink-0 rounded border-mc-border text-mc-action focus:ring-mc-focus"
                              />
                              <span className="min-w-0">
                                {competitiveGenderLabel(definition.genero)} · {definition.nome} ·{' '}
                                {weightLabel(definition)}
                              </span>
                            </label>
                            {checked && (needs.idade || needs.peso) ? (
                              <div className="ml-7 mt-2 grid gap-mc-8 sm:grid-cols-2">
                                {needs.idade ? (
                                  <FormField
                                    id={`override-idade-${definition.id}`}
                                    label="Idade máxima (sem teto no catálogo)"
                                    required
                                  >
                                    <Input
                                      name={`override_idade_max__${definition.id}`}
                                      type="number"
                                      min={definition.idade_min}
                                      placeholder="Ex.: 99"
                                      value={overrides[definition.id]?.idadeMax || ''}
                                      onChange={(event) => patchOverride(definition.id, { idadeMax: event.target.value })}
                                      required
                                    />
                                  </FormField>
                                ) : null}
                                {needs.peso ? (
                                  <FormField
                                    id={`override-peso-${definition.id}`}
                                    label="Peso máximo, kg (sem teto no catálogo)"
                                    required
                                  >
                                    <Input
                                      name={`override_peso_max__${definition.id}`}
                                      type="number"
                                      min={definition.peso_min_kg}
                                      step="0.01"
                                      placeholder="Ex.: 150"
                                      value={overrides[definition.id]?.pesoMax || ''}
                                      onChange={(event) => patchOverride(definition.id, { pesoMax: event.target.value })}
                                      required
                                    />
                                  </FormField>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <p className="font-mc-interface text-sm text-mc-text-secondary" role="status">
                {selectionPreview?.ok
                  ? `${selectionPreview.rows.length} ${selectionPreview.rows.length === 1 ? 'categoria efetiva' : 'categorias efetivas'} a partir de ${selectedIds.size} ${selectedIds.size === 1 ? 'definição selecionada' : 'definições selecionadas'}.`
                  : selectedIds.size
                    ? selectionPreview && !selectionPreview.ok
                      ? selectionPreview.message
                      : `${selectedIds.size} ${selectedIds.size === 1 ? 'definição selecionada' : 'definições selecionadas'}.`
                    : 'Nenhuma categoria selecionada ainda.'}
              </p>
            </TabsContent>

            <TabsContent value="custom" className="min-w-0 space-y-mc-24">
              <CustomCategoryFields
                fields={fields}
                catalog={catalog}
                selectedDefinition={selectedDefinition}
                patchFields={patchFields}
                handleCatalogSelect={handleCatalogSelect}
                beltOptions={beltOptions}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <CustomCategoryFields
            fields={fields}
            catalog={catalog}
            selectedDefinition={selectedDefinition}
            patchFields={patchFields}
            handleCatalogSelect={handleCatalogSelect}
            beltOptions={beltOptions}
          />
        )}

        <fieldset className="min-w-0 space-y-mc-16 border-t border-mc-border pt-4">
          <legend className="font-mc-interface text-xs font-semibold uppercase tracking-wide text-mc-text-secondary">
            Luta
          </legend>
          <div className="grid gap-mc-16 sm:grid-cols-2">
            <FormField id="fight-duration" label="Duração da luta (min)" description="Opcional. Pode ser ajustada depois sem nova versão. Aplica-se a todas as categorias desta versão.">
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

function CustomCategoryFields({
  fields,
  catalog,
  selectedDefinition,
  patchFields,
  handleCatalogSelect,
  beltOptions,
}: {
  fields: CategoryFormState
  catalog: { id: string; nome: string; versao: number; definitions: CatalogCategoryDefinition[] } | null
  selectedDefinition: CatalogCategoryDefinition | null
  patchFields: (partial: Partial<CategoryFormState>) => void
  handleCatalogSelect: (id: string) => void
  beltOptions: Array<{ value: string; label: string }>
}) {
  return (
    <>
      <fieldset className="min-w-0 space-y-mc-16">
        <legend className="font-mc-interface text-xs font-semibold uppercase tracking-wide text-mc-text-secondary">
          Categoria customizada
        </legend>
        <div className="grid min-w-0 gap-mc-16 sm:grid-cols-2">
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
    </>
  )
}
