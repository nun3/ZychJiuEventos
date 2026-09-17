'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, GitBranch, RotateCcw, Save, Send, Users } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/StatusBadge'
import {
  generateCategoryBracket,
  publishCategoryBracket,
  regenerateCategoryBracket,
  restoreCategoryBracketSuggestion,
  saveCategoryBracketComposition,
  type BracketActionResult,
} from './actions'
import type {
  BracketGroupView,
  BracketPageData,
  BracketView,
} from './data'

type EditableGroup = Pick<BracketGroupView, 'label' | 'sortOrder' | 'topology'> & {
  slots: Array<{ slot: number; participantId: string }>
}

const topologyNames = {
  final_2: 'Final direta',
  copo_3: 'Copo com 3 atletas',
  semi_4: 'Semifinais com 4 atletas',
}

const bracketStatusNames = {
  draft: 'Rascunho',
  publicada: 'Publicada',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  substituida: 'Substituída',
}

function initialGroups(bracket: BracketView | null): EditableGroup[] {
  return (bracket?.groups || []).map((group) => ({
    label: group.label,
    sortOrder: group.sortOrder,
    topology: group.topology,
    slots: group.slots.map((slot) => ({ slot: slot.slot, participantId: slot.participantId })),
  }))
}

function bracketBadge(bracket: BracketView | null) {
  if (!bracket) return <StatusBadge variant="neutral">Sem chave</StatusBadge>
  return (
    <StatusBadge variant={bracket.status === 'draft' ? 'warning' : 'success'}>
      {bracketStatusNames[bracket.status]} · v{bracket.version}
    </StatusBadge>
  )
}

function ReadOnlyBracket({ bracket }: { bracket: BracketView }) {
  const participantById = new Map(bracket.participants.map((participant) => [participant.id, participant]))

  return (
    <div className="space-y-mc-16">
      {bracket.groups.map((group) => {
        const entryParticipant = new Map(
          group.slots.map((slot) => [slot.entryId, participantById.get(slot.participantId)]),
        )
        const matchById = new Map(group.matches.map((match) => [match.id, match]))
        const sideName = (entryId: string | null, sourceMatchId: string | null) => {
          if (entryId) return entryParticipant.get(entryId)?.name || 'Atleta'
          const source = sourceMatchId ? matchById.get(sourceMatchId) : null
          return source ? `Vencedor da semifinal ${source.pairIndex}` : 'A definir'
        }

        return (
          <Card key={group.id} className="overflow-hidden">
            <header className="flex flex-wrap items-center justify-between gap-mc-8 border-b border-mc-border bg-mc-surface-secondary p-mc-16">
              <h3 className="font-mc-display text-mc-h3 text-mc-text-primary">Grupo {group.label}</h3>
              <StatusBadge>{topologyNames[group.topology]}</StatusBadge>
            </header>
            <div className="grid gap-mc-16 p-mc-16 lg:grid-cols-2">
              <ol className="space-y-mc-8" aria-label={`Atletas do grupo ${group.label}`}>
                {group.slots.map((slot) => {
                  const participant = participantById.get(slot.participantId)
                  return (
                    <li key={slot.entryId} className="flex items-start gap-mc-12 rounded-mc-small border border-mc-border p-mc-12">
                      <span className="font-mono text-sm font-semibold text-mc-text-secondary">{String(slot.slot).padStart(2, '0')}</span>
                      <span className="min-w-0">
                        <span className="block font-semibold text-mc-text-primary">{participant?.name || 'Atleta não encontrado'}</span>
                        <span className="block text-sm text-mc-text-secondary">{participant?.teamName || 'Sem equipe informada'}</span>
                      </span>
                    </li>
                  )
                })}
              </ol>
              <div>
                <h4 className="font-semibold text-mc-text-primary">Confrontos</h4>
                <ol className="mt-mc-8 space-y-mc-8">
                  {group.matches.map((match) => (
                    <li key={match.id} className="rounded-mc-small bg-mc-surface-secondary p-mc-12 text-sm">
                      <span className="font-semibold capitalize text-mc-text-primary">
                        {match.round} {match.round === 'semifinal' ? match.pairIndex : ''}
                      </span>
                      <span className="mt-mc-4 block text-mc-text-secondary">
                        {sideName(match.sideAEntryId, match.sideASourceMatchId)} × {sideName(match.sideBEntryId, match.sideBSourceMatchId)}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

export default function BracketWorkspace({ data }: { data: BracketPageData }) {
  const router = useRouter()
  const [selectedCategoryId, setSelectedCategoryId] = useState(data.categories[0]?.id || '')
  const selectedCategory = data.categories.find((category) => category.id === selectedCategoryId) || data.categories[0]
  const draft = selectedCategory?.draft || null
  const [groups, setGroups] = useState<EditableGroup[]>(() => initialGroups(draft))
  const [feedback, setFeedback] = useState<BracketActionResult | null>(null)
  const [reason, setReason] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [isPending, startTransition] = useTransition()
  const draftSignature = useMemo(
    () => JSON.stringify(draft?.groups.map((group) => [group.label, group.topology, group.slots.map((slot) => [slot.slot, slot.participantId])]) || []),
    [draft],
  )

  useEffect(() => {
    setGroups(initialGroups(draft))
    setIsDirty(false)
  }, [draft, draftSignature])

  useEffect(() => {
    if (selectedCategoryId && !data.categories.some((category) => category.id === selectedCategoryId)) {
      setSelectedCategoryId(data.categories[0]?.id || '')
    }
  }, [data.categories, selectedCategoryId])

  const canOperate = data.event.checkingLocked && ['checagem', 'chaves'].includes(data.event.status)

  function runAction(action: () => Promise<BracketActionResult>, afterSuccess?: () => void) {
    setFeedback(null)
    startTransition(() => {
      void action().then((result) => {
        setFeedback(result)
        if (result.ok) {
          afterSuccess?.()
          router.refresh()
        }
      })
    })
  }

  function formData(values: Record<string, string>) {
    const form = new FormData()
    Object.entries(values).forEach(([key, value]) => form.set(key, value))
    return form
  }

  function swapParticipant(targetGroupIndex: number, targetSlotIndex: number, participantId: string) {
    setGroups((current) => {
      const next = current.map((group) => ({ ...group, slots: group.slots.map((slot) => ({ ...slot })) }))
      const target = next[targetGroupIndex].slots[targetSlotIndex]
      let source: { groupIndex: number; slotIndex: number } | null = null

      next.forEach((group, groupIndex) => {
        group.slots.forEach((slot, slotIndex) => {
          if (slot.participantId === participantId) source = { groupIndex, slotIndex }
        })
      })
      if (!source) return current

      const previousParticipant = target.participantId
      const sourceLocation = source as { groupIndex: number; slotIndex: number }
      next[sourceLocation.groupIndex].slots[sourceLocation.slotIndex].participantId = previousParticipant
      target.participantId = participantId
      return next
    })
    setIsDirty(true)
    setFeedback(null)
  }

  function saveDraft() {
    if (!selectedCategory || !draft) return
    const payload = {
      groups: groups.map((group) => ({
        label: group.label,
        topology: group.topology,
        slots: group.slots.map((slot) => ({ slot: slot.slot, participant_id: slot.participantId })),
      })),
    }
    runAction(
      () => saveCategoryBracketComposition(formData({
        event_id: data.event.id,
        bracket_id: draft.id,
        groups_payload: JSON.stringify(payload),
      })),
      () => setIsDirty(false),
    )
  }

  if (!data.categories.length) {
    return (
      <EmptyState
        className="mt-mc-24 rounded-mc-medium border border-mc-border bg-mc-surface"
        icon={<Users size={34} />}
        title="Nenhuma categoria com atletas"
        description="As chaves são geradas a partir das inscrições efetivadas na alocação vigente."
      />
    )
  }

  if (!selectedCategory) return null

  const activeBracket = draft || selectedCategory.published

  return (
    <div className="mt-mc-24 grid items-start gap-mc-24 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <aside aria-labelledby="bracket-categories-title">
        <h2 id="bracket-categories-title" className="font-mc-display text-mc-h3 text-mc-text-primary">Categorias</h2>
        <label className="mt-mc-12 block lg:hidden">
          <span className="mb-mc-4 block text-sm font-semibold text-mc-text-primary">Categoria selecionada</span>
          <select
            value={selectedCategory.id}
            onChange={(event) => {
              setSelectedCategoryId(event.target.value)
              setFeedback(null)
            }}
            className="min-h-11 w-full rounded-mc-small border border-mc-border bg-mc-surface px-3 text-mc-text-primary focus:border-mc-focus focus:outline-none focus:ring-2 focus:ring-mc-focus/20"
          >
            {data.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
        <div className="mt-mc-12 hidden space-y-mc-8 lg:block">
          {data.categories.map((category) => {
            const bracket = category.draft || category.published
            const selected = category.id === selectedCategory.id
            return (
              <button
                key={category.id}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  setSelectedCategoryId(category.id)
                  setFeedback(null)
                }}
                className={`w-full rounded-mc-medium border p-mc-12 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus ${
                  selected ? 'border-mc-action bg-mc-action/5' : 'border-mc-border bg-mc-surface hover:bg-mc-surface-secondary'
                }`}
              >
                <span className="block font-semibold text-mc-text-primary">{category.name}</span>
                <span className="mt-mc-4 block text-sm text-mc-text-secondary">{category.athleteCount} {category.athleteCount === 1 ? 'atleta' : 'atletas'} · {category.gender}</span>
                <span className="mt-mc-8 block">{bracketBadge(bracket)}</span>
              </button>
            )
          })}
        </div>
      </aside>

      <section aria-labelledby="selected-bracket-title" className="min-w-0">
        <Card className="mb-mc-16 p-mc-16 sm:p-mc-24">
          <div className="flex flex-col gap-mc-16 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-mc-8">
                <h2 id="selected-bracket-title" className="font-mc-display text-mc-h2 text-mc-text-primary">{selectedCategory.name}</h2>
                {bracketBadge(activeBracket)}
              </div>
              <p className="mt-mc-4 text-sm text-mc-text-secondary">
                {selectedCategory.athleteCount} {selectedCategory.athleteCount === 1 ? 'atleta efetivado' : 'atletas efetivados'}
                {selectedCategory.published && draft ? ` · versão ${selectedCategory.published.version} publicada preservada` : ''}
              </p>
            </div>

            {!activeBracket ? (
              <Button
                disabled={isPending || !canOperate || selectedCategory.athleteCount === 0}
                onClick={() => runAction(() => generateCategoryBracket(formData({
                  event_id: data.event.id,
                  category_id: selectedCategory.id,
                })))}
              >
                <GitBranch aria-hidden="true" size={18} />
                {isPending ? 'Gerando…' : 'Gerar chave'}
              </Button>
            ) : null}
          </div>
        </Card>

        {feedback ? (
          <Alert className="mb-mc-16" role={feedback.ok ? 'status' : 'alert'} variant={feedback.ok ? 'success' : 'error'}>
            {feedback.message}
          </Alert>
        ) : null}

        {!activeBracket ? (
          <EmptyState
            className="rounded-mc-medium border border-mc-border bg-mc-surface"
            icon={<GitBranch size={34} />}
            title="Chave ainda não gerada"
            description="A geração cria uma sugestão automática em rascunho usando a lista travada e a alocação vigente."
          />
        ) : activeBracket.mode === 'sem_confronto' ? (
          <Card className="p-mc-24">
            <div className="flex flex-col gap-mc-16 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <StatusBadge variant="info">Sem confronto</StatusBadge>
                <h3 className="mt-mc-12 font-mc-display text-mc-h3 text-mc-text-primary">
                  {activeBracket.participants[0]?.name || 'Atleta'}
                </h3>
                <p className="mt-mc-4 text-mc-text-secondary">{activeBracket.participants[0]?.teamName || 'Sem equipe informada'}</p>
                <p className="mt-mc-12 text-sm text-mc-text-secondary">Não há bracket fictício nem campeão automático.</p>
              </div>
              {draft ? (
                <Button
                  disabled={isPending || !canOperate}
                  onClick={() => {
                    if (window.confirm('Publicar esta chave sem confronto?')) {
                      runAction(() => publishCategoryBracket(formData({ event_id: data.event.id, bracket_id: draft.id })))
                    }
                  }}
                >
                  <Send aria-hidden="true" size={18} />
                  Publicar
                </Button>
              ) : null}
            </div>
          </Card>
        ) : draft ? (
          <>
            {draft.warnings.length ? (
              <Alert className="mb-mc-16" variant="warning" icon={<AlertTriangle size={20} />} title="Atletas da mesma equipe se enfrentam">
                {draft.warnings.map((warning) => (
                  <span key={`${warning.groupLabel}-${warning.slots.join('-')}`} className="block">
                    Grupo {warning.groupLabel}, slots {warning.slots.map((slot) => String(slot).padStart(2, '0')).join(' e ')}: {warning.teamName}.
                  </span>
                ))}
                <span className="mt-mc-4 block">Este aviso não impede salvar ou publicar.</span>
              </Alert>
            ) : null}

            <div className="space-y-mc-16">
              {groups.map((group, groupIndex) => (
                <Card key={group.label} className="overflow-hidden">
                  <header className="flex flex-wrap items-center justify-between gap-mc-8 border-b border-mc-border bg-mc-surface-secondary p-mc-16">
                    <h3 className="font-mc-display text-mc-h3 text-mc-text-primary">Grupo {group.label}</h3>
                    <StatusBadge>{topologyNames[group.topology]}</StatusBadge>
                  </header>
                  <div className="grid gap-mc-12 p-mc-16 sm:grid-cols-2">
                    {group.slots.map((slot, slotIndex) => {
                      const participant = draft.participants.find((item) => item.id === slot.participantId)
                      const cupSlot = group.topology === 'copo_3' && slot.slot === 2
                      return (
                        <label key={slot.slot} className="block rounded-mc-small border border-mc-border p-mc-12">
                          <span className="flex items-center justify-between gap-mc-8 text-sm font-semibold text-mc-text-primary">
                            Slot {String(slot.slot).padStart(2, '0')}
                            {cupSlot ? <StatusBadge variant="info">Copo</StatusBadge> : null}
                          </span>
                          <select
                            value={slot.participantId}
                            disabled={isPending}
                            onChange={(event) => swapParticipant(groupIndex, slotIndex, event.target.value)}
                            className="mt-mc-8 min-h-11 w-full rounded-mc-small border border-mc-border bg-mc-surface px-3 text-mc-text-primary focus:border-mc-focus focus:outline-none focus:ring-2 focus:ring-mc-focus/20 disabled:opacity-60"
                          >
                            {draft.participants.map((item) => (
                              <option key={item.id} value={item.id}>{item.name} — {item.teamName || 'sem equipe'}</option>
                            ))}
                          </select>
                          <span className="mt-mc-4 block text-sm text-mc-text-secondary">{participant?.teamName || 'Sem equipe informada'}</span>
                        </label>
                      )
                    })}
                  </div>
                </Card>
              ))}
            </div>

            <div className="mt-mc-16 flex flex-col gap-mc-8 sm:flex-row sm:flex-wrap">
              <Button disabled={isPending || !isDirty || !canOperate} onClick={saveDraft}>
                <Save aria-hidden="true" size={18} />
                {isPending ? 'Salvando…' : 'Salvar composição'}
              </Button>
              <Button
                variant="outline"
                disabled={isPending || !canOperate}
                onClick={() => {
                  if (window.confirm('Descartar os ajustes e restaurar a sugestão automática?')) {
                    runAction(() => restoreCategoryBracketSuggestion(formData({ event_id: data.event.id, bracket_id: draft.id })))
                  }
                }}
              >
                <RotateCcw aria-hidden="true" size={18} />
                Restaurar sugestão
              </Button>
              <Button
                variant="secondary"
                disabled={isPending || isDirty || !canOperate}
                title={isDirty ? 'Salve a composição antes de publicar.' : undefined}
                onClick={() => {
                  if (window.confirm('Publicar esta versão? A composição ficará somente para leitura.')) {
                    runAction(() => publishCategoryBracket(formData({ event_id: data.event.id, bracket_id: draft.id })))
                  }
                }}
              >
                <Send aria-hidden="true" size={18} />
                Publicar
              </Button>
            </div>
            <p className="mt-mc-8 text-sm text-mc-text-secondary">Selecionar um atleta já usado troca os dois slots. Isso permite ajustar confrontos e mover atletas entre grupos sem deixar posições vazias.</p>
          </>
        ) : selectedCategory.published ? (
          <>
            {selectedCategory.published.warnings.length ? (
              <Alert className="mb-mc-16" variant="warning" icon={<AlertTriangle size={20} />} title="Aviso de mesma equipe">
                A versão publicada contém confronto entre atletas da mesma equipe. O aviso é informativo e não bloqueia a chave.
              </Alert>
            ) : null}
            <Alert className="mb-mc-16" variant="info" title="Versão publicada — somente leitura">
              A composição oficial não pode ser editada neste lote. Para preparar uma nova versão, informe o motivo e regenere.
            </Alert>
            <ReadOnlyBracket bracket={selectedCategory.published} />
            <Card className="mt-mc-16 p-mc-16">
              <label htmlFor="regeneration-reason" className="font-semibold text-mc-text-primary">Motivo da nova versão</label>
              <div className="mt-mc-8 flex flex-col gap-mc-8 sm:flex-row">
                <Input
                  id="regeneration-reason"
                  value={reason}
                  minLength={5}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Ex.: ajuste operacional solicitado"
                  disabled={isPending || !canOperate}
                />
                <Button
                  variant="outline"
                  disabled={isPending || !canOperate || reason.trim().length < 5}
                  onClick={() => runAction(
                    () => regenerateCategoryBracket(formData({
                      event_id: data.event.id,
                      bracket_id: selectedCategory.published!.id,
                      reason,
                    })),
                    () => setReason(''),
                  )}
                >
                  <RotateCcw aria-hidden="true" size={18} />
                  Regenerar
                </Button>
              </div>
            </Card>
          </>
        ) : null}
      </section>
    </div>
  )
}
