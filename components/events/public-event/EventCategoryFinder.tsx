'use client'

import { useId, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { Button, Dialog, FormField, Input, Select } from '@/components/ui'
import type { Category } from '@/lib/categorization'
import { RECOGNIZED_BELTS } from '@/lib/registrations/correction'
import {
  parsePublicWeightKg,
  resolvePublicCategory,
  type PublicCategoryMatch,
} from '@/lib/events/category-resolver'

function formatKg(value: number) {
  return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} kg`
}

export default function EventCategoryFinder({
  eventId,
  eventDate,
  categories,
  showRegistrationCta,
}: {
  eventId: string
  eventDate: string
  categories: Category[]
  showRegistrationCta: boolean
}) {
  const formId = useId()
  const [open, setOpen] = useState(false)
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState<'M' | 'F'>('M')
  const [belt, setBelt] = useState<string>(RECOGNIZED_BELTS[0])
  const [weightRaw, setWeightRaw] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [match, setMatch] = useState<PublicCategoryMatch | null>(null)

  function resetResult() {
    setMatch(null)
    setError(null)
  }

  function handleClose() {
    setOpen(false)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const weightKg = parsePublicWeightKg(weightRaw)
    if (weightKg == null) {
      setMatch(null)
      setError('Informe um peso válido em kg.')
      return
    }
    const resolution = resolvePublicCategory({
      birthDate,
      gender,
      belt,
      weightKg,
      eventDate,
      categories,
    })
    if (!resolution.ok) {
      setMatch(null)
      setError(resolution.reason)
      return
    }
    setError(null)
    setMatch(resolution.match)
  }

  return (
    <>
      <Button type="button" variant="secondary" size="small" onClick={() => setOpen(true)} className="gap-2">
        <Search size={16} aria-hidden="true" />
        Descobrir minha categoria
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        title="Descubra sua categoria"
        description="O cálculo usa apenas as categorias deste campeonato. Nada é salvo."
        className="max-w-lg"
      >
        <form id={formId} className="space-y-mc-16" onSubmit={handleSubmit}>
          <FormField id={`${formId}-birth`} label="Data de nascimento" required>
            <Input
              type="date"
              required
              value={birthDate}
              onChange={(event) => {
                setBirthDate(event.target.value)
                resetResult()
              }}
            />
          </FormField>

          <FormField id={`${formId}-gender`} label="Sexo" required>
            <Select
              required
              value={gender}
              onChange={(event) => {
                setGender(event.target.value === 'F' ? 'F' : 'M')
                resetResult()
              }}
            >
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
            </Select>
          </FormField>

          <FormField id={`${formId}-belt`} label="Faixa" required>
            <Select
              required
              value={belt}
              onChange={(event) => {
                setBelt(event.target.value)
                resetResult()
              }}
            >
              {RECOGNIZED_BELTS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField id={`${formId}-weight`} label="Peso atual (kg)" required description="Use vírgula ou ponto (ex.: 81,0).">
            <Input
              inputMode="decimal"
              required
              value={weightRaw}
              placeholder="81,0"
              onChange={(event) => {
                setWeightRaw(event.target.value)
                resetResult()
              }}
            />
          </FormField>

          <Button type="submit" className="w-full">
            Ver minha categoria
          </Button>
        </form>

        {error ? (
          <div className="mt-mc-16 rounded-mc-small border border-mc-border bg-mc-surface-secondary p-4" role="status">
            <p className="font-mc-interface text-sm text-mc-text-primary">{error}</p>
            <a
              href="#categorias"
              onClick={handleClose}
              className="mt-3 inline-flex min-h-11 items-center font-mc-interface text-sm font-semibold text-mc-action hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"
            >
              Ver categorias disponíveis
            </a>
          </div>
        ) : null}

        {match ? (
          <div className="mt-mc-16 rounded-mc-small border border-mc-border bg-mc-surface-secondary p-4" role="status">
            <p className="font-mc-interface text-[11px] font-semibold uppercase tracking-[0.14em] text-mc-text-secondary">
              Sua categoria
            </p>
            <p className="mt-2 font-mc-display text-xl font-bold text-mc-text-primary">{match.categoryLabel}</p>
            <dl className="mt-3 space-y-1.5 font-mc-interface text-sm text-mc-text-secondary">
              <div className="flex justify-between gap-3">
                <dt>Divisão etária</dt>
                <dd className="font-semibold text-mc-text-primary">{match.ageRangeLabel}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Sexo</dt>
                <dd className="font-semibold text-mc-text-primary">{match.genderLabel}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Faixa</dt>
                <dd className="font-semibold text-mc-text-primary">{match.beltLabel}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Idade no evento</dt>
                <dd className="font-semibold text-mc-text-primary">{match.competitiveAge} anos</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Limite de peso</dt>
                <dd className="font-semibold text-mc-text-primary">até {formatKg(match.weightLimitKg)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Peso informado</dt>
                <dd className="font-semibold text-mc-text-primary">{formatKg(match.weightInformedKg)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Margem para o limite</dt>
                <dd className="font-semibold text-mc-text-primary">{formatKg(match.marginKg)}</dd>
              </div>
            </dl>

            {showRegistrationCta ? (
              <Link
                href={`/eventos/${eventId}/inscricao/cadastrar-atleta`}
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-mc-small bg-mc-action px-3 font-mc-interface text-sm font-semibold text-white transition-colors hover:bg-mc-action/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"
              >
                Fazer inscrição
              </Link>
            ) : null}
          </div>
        ) : null}
      </Dialog>
    </>
  )
}
