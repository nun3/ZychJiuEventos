'use client'

import { useId, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { CalendarDays, CheckCircle2, Scale, Search, XCircle } from 'lucide-react'
import { Button, Dialog, FormField, Input, Select } from '@/components/ui'
import type { Category } from '@/lib/categorization'
import { RECOGNIZED_BELTS } from '@/lib/registrations/correction'
import {
  maskBrBirthDateInput,
  parseBrBirthDateToIso,
  parsePublicWeightKg,
  resolvePublicCategory,
  type PublicCategoryMatch,
} from '@/lib/events/category-resolver'

function formatKg(value: number) {
  return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} kg`
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-mc-border/70 py-2 last:border-b-0">
      <dt className="font-mc-interface text-sm text-mc-text-secondary">{label}</dt>
      <dd className="text-right font-mc-interface text-sm font-semibold text-mc-text-primary">{value}</dd>
    </div>
  )
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
  const birthInputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [birthDateDisplay, setBirthDateDisplay] = useState('')
  const [gender, setGender] = useState<'M' | 'F'>('M')
  const [belt, setBelt] = useState<string>(RECOGNIZED_BELTS[0])
  const [weightRaw, setWeightRaw] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [match, setMatch] = useState<PublicCategoryMatch | null>(null)

  function resetResult() {
    setMatch(null)
    setError(null)
    setFieldError(null)
  }

  function resetForm() {
    setBirthDateDisplay('')
    setGender('M')
    setBelt(RECOGNIZED_BELTS[0])
    setWeightRaw('')
    resetResult()
  }

  function handleOpen() {
    resetForm()
    setOpen(true)
  }

  function handleClose() {
    setOpen(false)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const birthIso = parseBrBirthDateToIso(birthDateDisplay)
    if (!birthIso) {
      setMatch(null)
      setError(null)
      setFieldError('Use o formato DD/MM/AAAA — por exemplo 20/10/1990.')
      birthInputRef.current?.focus()
      return
    }
    const weightKg = parsePublicWeightKg(weightRaw)
    if (weightKg == null) {
      setMatch(null)
      setError(null)
      setFieldError('Informe um peso válido em kg (ex.: 81,0).')
      return
    }
    const resolution = resolvePublicCategory({
      birthDate: birthIso,
      gender,
      belt,
      weightKg,
      eventDate,
      categories,
    })
    if (!resolution.ok) {
      setMatch(null)
      setFieldError(null)
      setError(resolution.reason)
      return
    }
    setFieldError(null)
    setError(null)
    setMatch(resolution.match)
  }

  const marginTone =
    match == null
      ? ''
      : match.marginKg < 0
        ? 'text-mc-error'
        : match.marginKg <= 1
          ? 'text-mc-warning'
          : 'text-mc-success'

  return (
    <>
      <Button type="button" variant="secondary" size="small" onClick={handleOpen} className="gap-2">
        <Search size={16} aria-hidden="true" />
        Descobrir minha categoria
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        title="Descubra sua categoria"
        description="Cálculo instantâneo com as categorias oficiais deste campeonato. Nada é salvo."
        className="max-w-xl"
        initialFocusRef={birthInputRef}
      >
        <form id={formId} className="space-y-mc-16" onSubmit={handleSubmit} noValidate>
          <FormField
            id={`${formId}-birth`}
            label="Data de nascimento"
            required
            description="Digite dia, mês e ano — ex.: 20/10/1990."
            error={fieldError && fieldError.includes('DD/MM') ? fieldError : undefined}
          >
            <Input
              ref={birthInputRef}
              inputMode="numeric"
              autoComplete="bday"
              required
              placeholder="DD/MM/AAAA"
              maxLength={10}
              value={birthDateDisplay}
              aria-invalid={Boolean(fieldError && fieldError.includes('DD/MM')) || undefined}
              onChange={(event) => {
                setBirthDateDisplay(maskBrBirthDateInput(event.target.value))
                resetResult()
              }}
            />
          </FormField>

          <div className="grid gap-mc-16 sm:grid-cols-2">
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
          </div>

          <FormField
            id={`${formId}-weight`}
            label="Peso atual"
            required
            description="Aceita vírgula ou ponto."
            error={fieldError && fieldError.includes('peso') ? fieldError : undefined}
          >
            <div className="relative">
              <Input
                inputMode="decimal"
                required
                value={weightRaw}
                placeholder="81,0"
                className="pr-12"
                aria-invalid={Boolean(fieldError && fieldError.includes('peso')) || undefined}
                onChange={(event) => {
                  setWeightRaw(event.target.value)
                  resetResult()
                }}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 right-3 flex items-center font-mc-interface text-sm font-semibold text-mc-text-secondary"
              >
                kg
              </span>
            </div>
          </FormField>

          <Button type="submit" size="large" className="w-full gap-2">
            <Search size={18} aria-hidden="true" />
            Ver minha categoria
          </Button>
        </form>

        <div aria-live="polite" className="mt-mc-16">
          {error ? (
            <div className="rounded-mc-small border border-mc-border bg-mc-surface-secondary p-4" role="status">
              <div className="flex gap-3">
                <XCircle className="mt-0.5 shrink-0 text-mc-error" size={20} aria-hidden="true" />
                <div className="min-w-0">
                  <p className="font-mc-interface text-sm font-semibold text-mc-text-primary">Sem categoria compatível</p>
                  <p className="mt-1 font-mc-interface text-sm text-mc-text-secondary">{error}</p>
                  <a
                    href="#categorias"
                    onClick={handleClose}
                    className="mt-3 inline-flex min-h-11 items-center font-mc-interface text-sm font-semibold text-mc-action hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"
                  >
                    Ver categorias disponíveis
                  </a>
                </div>
              </div>
            </div>
          ) : null}

          {match ? (
            <div className="overflow-hidden rounded-mc-small border border-mc-border bg-mc-surface" role="status">
              <div className="border-b border-mc-border bg-mc-structure px-4 py-3 text-white">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-white/90" size={20} aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="font-mc-interface text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
                      Sua categoria neste campeonato
                    </p>
                    <p className="mt-1 font-mc-display text-xl font-bold leading-snug">{match.categoryLabel}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-0 sm:grid-cols-2">
                <div className="border-b border-mc-border p-4 sm:border-b-0 sm:border-r">
                  <p className="mb-1 flex items-center gap-2 font-mc-interface text-[11px] font-semibold uppercase tracking-[0.12em] text-mc-text-secondary">
                    <CalendarDays size={14} aria-hidden="true" />
                    Perfil competitivo
                  </p>
                  <dl>
                    <ResultRow label="Divisão etária" value={match.ageRangeLabel} />
                    <ResultRow label="Sexo" value={match.genderLabel} />
                    <ResultRow label="Faixa" value={match.beltLabel} />
                    <ResultRow label="Idade no evento" value={`${match.competitiveAge} anos`} />
                  </dl>
                </div>
                <div className="p-4">
                  <p className="mb-1 flex items-center gap-2 font-mc-interface text-[11px] font-semibold uppercase tracking-[0.12em] text-mc-text-secondary">
                    <Scale size={14} aria-hidden="true" />
                    Peso
                  </p>
                  <dl>
                    <ResultRow
                      label="Faixa de peso"
                      value={`${formatKg(match.weightMinKg)} – ${formatKg(match.weightLimitKg)}`}
                    />
                    <ResultRow label="Limite" value={`até ${formatKg(match.weightLimitKg)}`} />
                    <ResultRow label="Informado" value={formatKg(match.weightInformedKg)} />
                    <div className="flex items-baseline justify-between gap-3 py-2">
                      <dt className="font-mc-interface text-sm text-mc-text-secondary">Margem</dt>
                      <dd className={`text-right font-mc-interface text-sm font-semibold ${marginTone}`}>
                        {formatKg(match.marginKg)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {showRegistrationCta ? (
                <div className="border-t border-mc-border p-4">
                  <Link
                    href={`/eventos/${eventId}/inscricao/cadastrar-atleta`}
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-mc-small bg-mc-action px-3 font-mc-interface text-sm font-semibold text-white transition-colors hover:bg-mc-action/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"
                  >
                    Fazer inscrição
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </Dialog>
    </>
  )
}
