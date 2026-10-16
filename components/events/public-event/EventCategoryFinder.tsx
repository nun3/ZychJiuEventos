'use client'

import { useId, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2, LockKeyhole, Scale, Search, XCircle } from 'lucide-react'
import { Button, Dialog, FormField, Input, Select, StatusBadge } from '@/components/ui'
import { RECOGNIZED_BELTS } from '@/lib/registrations/correction'
import {
  maskBrBirthDateInput,
  parseBrBirthDateToIso,
  parsePublicWeightKg,
  resolvePublicCategory,
  type EventCategoryWithCatalog,
  type PublicCategoryResolution,
  type SportCategoryCatalog,
} from '@/lib/events/category-resolver'

function formatKg(value: number) {
  return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} kg`
}

export default function EventCategoryFinder({
  eventId,
  eventDate,
  categories,
  catalog,
  showRegistrationCta,
}: {
  eventId: string
  eventDate: string
  categories: EventCategoryWithCatalog[]
  catalog: SportCategoryCatalog | null
  showRegistrationCta: boolean
}) {
  const formId = useId()
  const birthInputRef = useRef<HTMLInputElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [birthDateDisplay, setBirthDateDisplay] = useState('')
  const [gender, setGender] = useState<'M' | 'F'>('M')
  const [belt, setBelt] = useState<string>(RECOGNIZED_BELTS[0])
  const [weightRaw, setWeightRaw] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [resolution, setResolution] = useState<PublicCategoryResolution | null>(null)

  function resetResult() {
    setResolution(null)
    setFieldError(null)
  }

  function handleOpen() {
    setBirthDateDisplay('')
    setGender('M')
    setBelt(RECOGNIZED_BELTS[0])
    setWeightRaw('')
    resetResult()
    setOpen(true)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const birthDate = parseBrBirthDateToIso(birthDateDisplay)
    if (!birthDate) {
      setResolution(null)
      setFieldError('Use o formato DD/MM/AAAA — por exemplo 20/10/1990.')
      birthInputRef.current?.focus()
      return
    }
    const weightKg = parsePublicWeightKg(weightRaw)
    if (weightKg == null) {
      setResolution(null)
      setFieldError('Informe um peso válido em kg (ex.: 81,0).')
      return
    }
    setFieldError(null)
    setResolution(resolvePublicCategory({
      birthDate,
      gender,
      belt,
      weightKg,
      eventDate,
      eventCategories: categories,
      catalog,
    }))
    if (window.matchMedia('(max-width: 1023px)').matches) {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' }))
    }
  }

  const result = resolution?.status === 'resolved' ? resolution : null
  const classification = result?.classification

  return (
    <>
      <Button type="button" size="medium" onClick={handleOpen} className="gap-2">
        <Search size={17} aria-hidden="true" />
        Descobrir minha categoria
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Descubra sua categoria"
        description="Informe seus dados e veja em segundos sua classificação e a disponibilidade neste campeonato."
        className="p-4 sm:max-w-[54rem] sm:p-6"
        initialFocusRef={birthInputRef}
      >
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <form id={formId} className="space-y-4" onSubmit={handleSubmit} noValidate>
            <FormField
              id={`${formId}-birth`}
              label="Data de nascimento"
              required
              description="Calculamos sua divisão etária na data do campeonato."
              error={fieldError?.includes('DD/MM') ? fieldError : undefined}
            >
              <Input
                ref={birthInputRef}
                inputMode="numeric"
                autoComplete="bday"
                required
                placeholder="DD/MM/AAAA"
                maxLength={10}
                value={birthDateDisplay}
                onChange={(event) => {
                  setBirthDateDisplay(maskBrBirthDateInput(event.target.value))
                  resetResult()
                }}
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id={`${formId}-gender`} label="Sexo" required>
                <Select value={gender} onChange={(event) => {
                  setGender(event.target.value === 'F' ? 'F' : 'M')
                  resetResult()
                }}>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </Select>
              </FormField>
              <FormField id={`${formId}-belt`} label="Faixa" required>
                <Select value={belt} onChange={(event) => {
                  setBelt(event.target.value)
                  resetResult()
                }}>
                  {RECOGNIZED_BELTS.map((item) => <option key={item} value={item}>{item}</option>)}
                </Select>
              </FormField>
            </div>

            <FormField
              id={`${formId}-weight`}
              label="Peso atual"
              required
              description="Aceita vírgula ou ponto."
              error={fieldError?.includes('peso') ? fieldError : undefined}
            >
              <div id={`${formId}-weight-control`} className="relative">
                <Input
                  id={`${formId}-weight`}
                  inputMode="decimal"
                  required
                  value={weightRaw}
                  placeholder="92,0"
                  className="pr-12 text-lg font-semibold"
                  onChange={(event) => {
                    setWeightRaw(event.target.value)
                    resetResult()
                  }}
                />
                <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-semibold text-mc-text-secondary">kg</span>
              </div>
            </FormField>

            <Button type="submit" size="large" className="w-full gap-2">
              <Search size={18} aria-hidden="true" />
              Ver minha categoria
            </Button>
            <p className="flex items-center justify-center gap-1.5 text-center font-mc-interface text-xs text-mc-text-secondary">
              <LockKeyhole size={13} aria-hidden="true" /> Nada é salvo.
            </p>
          </form>

          <div ref={resultRef} aria-live="polite" className="scroll-mt-4 min-h-[18rem] rounded-mc-medium border border-mc-border bg-mc-surface-secondary/60 p-4 sm:p-5">
            {!resolution ? (
              <div className="flex min-h-[16rem] flex-col items-center justify-center text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-mc-full bg-mc-action/10 text-mc-action"><Scale size={23} aria-hidden="true" /></span>
                <p className="mt-4 font-mc-display text-lg font-semibold text-mc-text-primary">Sua classificação aparecerá aqui</p>
                <p className="mt-2 max-w-xs font-mc-interface text-sm leading-6 text-mc-text-secondary">Mostraremos primeiro sua categoria e depois se ela está disponível no evento.</p>
              </div>
            ) : null}

            {resolution?.status === 'unresolved' ? (
              <div role="status">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-mc-full bg-mc-warning/10 text-mc-warning">
                    <AlertTriangle size={18} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-mc-display text-lg font-semibold leading-7 text-mc-text-primary">
                      {resolution.diagnosis ? 'Nenhuma categoria para o seu perfil' : 'Não foi possível identificar sua categoria'}
                    </p>
                    <p className="mt-1 font-mc-interface text-sm leading-6 text-mc-text-secondary">{resolution.reason}</p>
                  </div>
                </div>

                {resolution.diagnosis ? (
                  <>
                    <div aria-hidden="true" className="mt-5 flex items-center justify-between pl-7 font-mc-interface text-xs font-semibold uppercase tracking-[0.14em] text-mc-text-secondary">
                      <span>Você</span>
                      <span>Campeonato</span>
                    </div>
                    <ul className="mt-2 divide-y divide-mc-border border-y border-mc-border">
                      {resolution.diagnosis.checks.map((check) => (
                        <li key={check.criterion} className="flex items-start gap-2.5 py-3">
                          {check.ok ? (
                            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-mc-success" aria-hidden="true" />
                          ) : (
                            <XCircle size={18} className="mt-0.5 shrink-0 text-mc-error" aria-hidden="true" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-mc-interface text-xs text-mc-text-secondary">
                              {check.label}
                              <span className="sr-only">{check.ok ? ': compatível' : ': fora do aceito'}</span>
                            </p>
                            <div className="mt-0.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                              <p className="whitespace-nowrap font-mc-display text-base font-bold text-mc-text-primary">{check.informed}</p>
                              {check.accepted ? (
                                <p className={`whitespace-nowrap font-mc-interface text-sm font-semibold ${check.ok ? 'text-mc-text-secondary' : 'text-mc-error'}`}>
                                  <span className="sr-only">Campeonato aceita: </span>{check.accepted}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 font-mc-interface text-xs leading-5 text-mc-text-secondary">
                      A idade é calculada na data do campeonato. Confira os dados ou fale com a organização.
                    </p>
                    <a href="#categorias-disponiveis" onClick={() => setOpen(false)} className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-mc-medium border border-mc-border bg-mc-surface px-4 text-sm font-semibold text-mc-text-primary hover:bg-mc-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus">Ver categorias do campeonato</a>
                  </>
                ) : null}
              </div>
            ) : null}

            {classification && result ? (
              <div role="status">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-mc-interface text-xs font-semibold uppercase tracking-[0.14em] text-mc-text-secondary">Sua categoria</p>
                  {classification.source === 'catalog' ? <span className="font-mc-interface text-xs text-mc-text-secondary">GI · catálogo v{classification.catalogVersion}</span> : null}
                </div>
                <h3 className="mt-2 font-mc-display text-3xl font-bold uppercase tracking-tight text-mc-text-primary">{classification.categoryLabel}</h3>
                <p className="mt-2 font-mc-interface text-sm text-mc-text-secondary">
                  {classification.ageDivisionLabel} · {classification.genderLabel} · Faixa {classification.beltLabel}
                </p>

                <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-y border-mc-border py-4 sm:grid-cols-3">
                  <div><dt className="text-xs text-mc-text-secondary">Peso informado</dt><dd className="mt-1 font-mc-display text-lg font-bold text-mc-text-primary">{formatKg(classification.weightInformedKg)}</dd></div>
                  <div><dt className="text-xs text-mc-text-secondary">Limite</dt><dd className="mt-1 font-mc-display text-lg font-bold text-mc-text-primary">{classification.weightLimitKg == null ? 'Sem limite' : formatKg(classification.weightLimitKg)}</dd></div>
                  <div className="col-span-2 sm:col-span-1"><dt className="text-xs text-mc-text-secondary">Margem</dt><dd className="mt-1 font-mc-display text-lg font-bold text-mc-text-primary">{classification.marginKg == null ? '—' : formatKg(classification.marginKg)}</dd></div>
                </dl>

                <div className="mt-4">
                  {result.availability.available ? (
                    <StatusBadge variant="success" icon={<CheckCircle2 size={14} />}>Disponível neste campeonato</StatusBadge>
                  ) : (
                    <StatusBadge variant="warning" icon={<AlertTriangle size={14} />}>Não disponível neste campeonato</StatusBadge>
                  )}
                </div>

                <div className="mt-5 space-y-2">
                  {result.availability.available && showRegistrationCta ? (
                    <Link href={`/eventos/${eventId}/inscricao/cadastrar-atleta`} className="inline-flex min-h-12 w-full items-center justify-center rounded-mc-medium bg-mc-action px-4 text-sm font-semibold text-white transition-colors hover:bg-mc-action/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus">Fazer inscrição</Link>
                  ) : null}
                  {!result.availability.available ? (
                    <a href="#categorias-disponiveis" onClick={() => setOpen(false)} className="inline-flex min-h-11 w-full items-center justify-center rounded-mc-medium border border-mc-border bg-mc-surface px-4 text-sm font-semibold text-mc-text-primary hover:bg-mc-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus">Ver categorias disponíveis</a>
                  ) : null}
                  {result.availability.available && !showRegistrationCta ? (
                    <p className="font-mc-interface text-sm leading-6 text-mc-text-secondary">Sua categoria foi identificada. As inscrições não estão abertas neste momento.</p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </Dialog>
    </>
  )
}
