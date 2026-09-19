'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/StatusBadge'
import {
  CORRECTION_FIELD_LABELS,
  RECOGNIZED_BELTS,
  REGISTRATION_CORRECTION_FIELDS,
  isCorrectionField,
  snapshotRecord,
  type RegistrationCorrectionField,
} from '@/lib/registrations/correction'
import type { Json } from '@/lib/supabase/database.types'
import {
  listRegistrationCorrections,
  requestRegistrationCorrection,
  type CorrectionRequestItem,
  type TeamOption,
} from './registration-correction-actions'

function statusVariant(status: string) {
  if (status === 'aprovada') return 'success' as const
  if (status === 'recusada') return 'error' as const
  return 'warning' as const
}

export default function RegistrationCorrectionRequest({
  registrationId,
  snapshot,
  eventStatus,
  checkingLocked,
  teams,
}: {
  registrationId: string
  snapshot: Json
  eventStatus?: string | null
  checkingLocked: boolean
  teams: TeamOption[]
}) {
  const athlete = snapshotRecord(snapshot)
  const [field, setField] = useState<RegistrationCorrectionField>('nome')
  const [requests, setRequests] = useState<CorrectionRequestItem[] | null>(null)
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const canRequest = eventStatus === 'checagem' && !checkingLocked

  useEffect(() => {
    let cancelled = false
    void listRegistrationCorrections(registrationId).then((result) => {
      if (!cancelled) setRequests(result)
    })
    return () => { cancelled = true }
  }, [registrationId])

  const currentValue = useMemo(() => {
    if (field === 'nome') return typeof athlete.nome_completo === 'string' ? athlete.nome_completo : ''
    if (field === 'faixa') return typeof athlete.faixa === 'string' ? athlete.faixa : ''
    if (field === 'peso') return athlete.peso_kg == null ? '' : String(athlete.peso_kg)
    return typeof athlete.team_id === 'string' ? athlete.team_id : ''
  }, [athlete, field])

  function refresh() {
    void listRegistrationCorrections(registrationId).then(setRequests)
  }

  return (
    <div className="mt-mc-12 space-y-mc-12 rounded-mc-medium border border-mc-border bg-mc-surface-secondary p-mc-12">
      <p className="font-mc-interface text-sm font-semibold text-mc-text-primary">Solicitar correção</p>
      <p className="text-sm text-mc-text-secondary">
        Nome, faixa, peso e equipe desta inscrição. A aprovação corrige a inscrição; não muda a categoria automaticamente.
      </p>

      {canRequest ? (
        <form
          className="space-y-mc-12"
          action={(formData) => startTransition(async () => {
            setMessage(null)
            const result = await requestRegistrationCorrection(formData)
            setMessage({ ok: result.ok, text: result.message })
            if (result.ok) refresh()
          })}
        >
          <input type="hidden" name="registration_id" value={registrationId} />
          <FormField id={`correction-field-${registrationId}`} label="Campo" required>
            <Select
              name="requested_field"
              required
              value={field}
              onChange={(event) => {
                const next = event.target.value
                if (isCorrectionField(next)) setField(next)
              }}
            >
              {REGISTRATION_CORRECTION_FIELDS.map((item) => (
                <option key={item} value={item}>{CORRECTION_FIELD_LABELS[item]}</option>
              ))}
            </Select>
          </FormField>
          {field === 'nome' ? (
            <FormField id={`correction-name-${registrationId}`} label="Nome solicitado" required>
              <Input name="requested_text" required minLength={3} defaultValue={currentValue} key={`nome-${currentValue}`} />
            </FormField>
          ) : null}
          {field === 'faixa' ? (
            <FormField id={`correction-belt-${registrationId}`} label="Faixa solicitada" required>
              <Select name="requested_text" required defaultValue={currentValue || RECOGNIZED_BELTS[0]} key={`faixa-${currentValue}`}>
                {RECOGNIZED_BELTS.map((belt) => <option key={belt} value={belt}>{belt}</option>)}
              </Select>
            </FormField>
          ) : null}
          {field === 'peso' ? (
            <FormField id={`correction-weight-${registrationId}`} label="Peso solicitado (kg)" required>
              <Input name="requested_text" type="number" inputMode="decimal" min="0.1" step="0.01" required defaultValue={currentValue} key={`peso-${currentValue}`} />
            </FormField>
          ) : null}
          {field === 'equipe' ? (
            <FormField id={`correction-team-${registrationId}`} label="Equipe solicitada" required>
              <Select name="requested_text" required defaultValue={currentValue} key={`equipe-${currentValue}`}>
                <option value="" disabled>Selecione</option>
                {teams.map((team) => <option key={team.id} value={team.id}>{team.nome}</option>)}
              </Select>
            </FormField>
          ) : null}
          <FormField id={`correction-reason-${registrationId}`} label="Motivo (opcional)">
            <textarea
              id={`correction-reason-${registrationId}`}
              name="reason"
              rows={2}
              className="min-h-11 w-full rounded-mc-small border border-mc-border bg-mc-surface px-3 py-2 font-mc-interface text-base text-mc-text-primary focus:border-mc-focus focus:outline-none focus:ring-2 focus:ring-mc-focus/20"
            />
          </FormField>
          {message ? <Alert variant={message.ok ? 'success' : 'error'} role={message.ok ? 'status' : 'alert'}>{message.text}</Alert> : null}
          <Button type="submit" size="small" disabled={pending}>{pending ? 'Enviando…' : 'Enviar solicitação'}</Button>
        </form>
      ) : (
        <p className="text-sm text-mc-text-secondary">
          {checkingLocked
            ? 'A checagem está travada. As solicitações abaixo ficam somente como histórico.'
            : 'A solicitação só fica disponível durante a fase de checagem, antes do travamento.'}
        </p>
      )}

      {requests?.length ? (
        <ul className="space-y-mc-8">
          {requests.map((request) => (
            <li key={request.id} className="rounded-mc-small border border-mc-border bg-mc-surface p-mc-12">
              <div className="flex flex-wrap items-center gap-mc-8">
                <p className="font-semibold text-mc-text-primary">{request.fieldLabel}</p>
                <StatusBadge variant={statusVariant(request.status)}>{request.statusLabel}</StatusBadge>
              </div>
              <p className="mt-mc-8 text-sm text-mc-text-secondary">{request.previousLabel} → {request.requestedLabel}</p>
              {request.reason ? <p className="mt-mc-4 text-sm text-mc-text-primary">{request.reason}</p> : null}
              {request.status === 'aprovada' && request.categoryCompatible === false ? (
                <p className="mt-mc-8 text-sm text-mc-text-primary">
                  Categoria vigente incompatível após a correção. Use a solicitação de categoria já existente; este pedido não recategoriza.
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
