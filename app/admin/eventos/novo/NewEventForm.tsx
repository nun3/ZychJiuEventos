'use client'

import { useRef, useState, useTransition, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { PanelColumns, panelClass } from '@/components/dashboard/PanelColumns'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { createEvent } from '../actions'

const phases = [
  ['inscricao', 'Inscrição'],
  ['pagamento', 'Pagamento'],
  ['checagem', 'Checagem'],
  ['chaves', 'Chaves'],
] as const

const fieldClass = 'min-h-28 w-full rounded-mc-small border border-mc-border bg-mc-surface px-3 py-2 font-mc-interface text-base text-mc-text-primary transition-colors duration-mc-normal hover:border-mc-text-secondary focus:border-mc-focus focus:outline-none focus:ring-2 focus:ring-mc-focus/20'

function textOf(formData: FormData, field: string) {
  return String(formData.get(field) || '').trim()
}

function FilePicker({
  name,
  label,
  accessibleName,
  accept,
  hint,
  action,
}: {
  name: string
  label: string
  accessibleName: string
  accept: string
  hint: string
  action: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')

  return (
    <div>
      <p className="font-mc-interface text-sm font-semibold text-mc-text-primary">{label}</p>
      <p id={`${name}-hint`} className="mt-1 font-mc-interface text-sm text-mc-text-secondary">{hint}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          name={name}
          type="file"
          accept={accept}
          aria-label={accessibleName}
          aria-describedby={`${name}-hint`}
          className="sr-only"
          onChange={(event) => setFileName(event.target.files?.[0]?.name || '')}
        />
        <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
          {action}
        </Button>
        <p className="min-w-0 break-all font-mc-interface text-sm text-mc-text-secondary">
          {fileName || 'Nenhum arquivo selecionado'}
        </p>
      </div>
    </div>
  )
}

export default function NewEventForm() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [phasesOpen, setPhasesOpen] = useState(false)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    const form = event.currentTarget
    const data = new FormData(form)
    const next: Record<string, string> = {}
    if (textOf(data, 'nome').length < 3) next.nome = 'Informe o nome do evento.'
    if (!textOf(data, 'data_evento')) next.data_evento = 'Informe a data do evento.'
    if (textOf(data, 'local').length < 3) next.local = 'Informe o local do evento.'
    const valor = Number(textOf(data, 'valor_inscricao').replace(',', '.'))
    if (!Number.isFinite(valor) || valor < 0) next.valor_inscricao = 'Informe um valor válido, em reais.'

    const ranges = phases.map(([tipo]) => ({
      inicio: textOf(data, `${tipo}_inicio`),
      fim: textOf(data, `${tipo}_fim`),
    }))
    let phaseError = ''
    if (ranges.some(({ inicio, fim }) => !inicio || !fim || new Date(inicio) >= new Date(fim))) {
      phaseError = 'Cada fase deve possuir início anterior ao término.'
    } else {
      for (let index = 1; index < ranges.length; index += 1) {
        if (new Date(ranges[index].inicio) < new Date(ranges[index - 1].fim)) {
          phaseError = 'As fases devem estar em ordem e não podem se sobrepor.'
        }
      }
    }
    if (phaseError) {
      next.phases = phaseError
      setPhasesOpen(true)
    }
    setErrors(next)
    if (Object.keys(next).length > 0) return

    data.set('intent', 'rascunho')
    setMessage(null)
    startTransition(async () => {
      const result = await createEvent(data)
      if (!result.ok) {
        setMessage(result.message)
        if (/fase|fuso/i.test(result.message)) setPhasesOpen(true)
        return
      }
      router.push(result.eventId ? `/admin/eventos/${result.eventId}/configuracao` : '/admin/eventos')
    })
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      {message ? <Alert variant="error" role="alert">{message}</Alert> : null}
      <PanelColumns
        main={(
          <>
            <section className={panelClass} aria-labelledby="event-essentials-title">
              <h2 id="event-essentials-title" className="font-mc-display text-xl font-semibold text-mc-text-primary">Informações essenciais</h2>
              <p className="mt-1 font-mc-interface text-sm text-mc-text-secondary">Comece com as informações essenciais do campeonato. Você poderá completar os detalhes antes de publicar.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <FormField id="nome" label="Nome do evento" required error={errors.nome} className="sm:col-span-2">
                  <Input name="nome" autoComplete="off" aria-invalid={Boolean(errors.nome)} />
                </FormField>
                <FormField id="data_evento" label="Data do evento" required error={errors.data_evento}>
                  <Input name="data_evento" type="date" aria-invalid={Boolean(errors.data_evento)} />
                </FormField>
                <FormField id="local" label="Local" required error={errors.local} description="Cidade e espaço onde o campeonato acontece.">
                  <Input name="local" autoComplete="off" aria-invalid={Boolean(errors.local)} />
                </FormField>
                <FormField id="timezone" label="Fuso horário" description="Os horários das fases usam este fuso." className="sm:col-span-2">
                  <Select name="timezone" defaultValue="America/Sao_Paulo">
                    <option>America/Sao_Paulo</option>
                    <option>America/Manaus</option>
                    <option>America/Rio_Branco</option>
                  </Select>
                </FormField>
              </div>
            </section>

            <section className={panelClass} aria-labelledby="event-price-title">
              <h2 id="event-price-title" className="font-mc-display text-xl font-semibold text-mc-text-primary">Inscrição</h2>
              <div className="mt-4 max-w-sm space-y-1.5">
                <div className="flex items-baseline gap-1">
                  <label htmlFor="valor_inscricao" className="font-mc-interface text-sm font-semibold text-mc-text-primary">Valor da inscrição (R$)</label>
                  <span aria-hidden="true" className="text-mc-error">*</span>
                </div>
                <div className="relative">
                  <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mc-interface text-sm text-mc-text-secondary">R$</span>
                  <Input
                    id="valor_inscricao"
                    name="valor_inscricao"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue="0"
                    inputMode="decimal"
                    className="pl-10"
                    aria-invalid={Boolean(errors.valor_inscricao)}
                    aria-describedby={errors.valor_inscricao ? 'valor_inscricao-error' : 'valor_inscricao-hint'}
                  />
                </div>
                <p id="valor_inscricao-hint" className="font-mc-interface text-sm text-mc-text-secondary">Valor base. R$ 0,00 é aceito neste rascunho.</p>
                {errors.valor_inscricao ? <p id="valor_inscricao-error" className="font-mc-interface text-sm text-mc-error">{errors.valor_inscricao}</p> : null}
              </div>
            </section>

            <section className={panelClass} aria-labelledby="event-summary-title">
              <h2 id="event-summary-title" className="font-mc-display text-xl font-semibold text-mc-text-primary">Página pública</h2>
              <div className="mt-4">
                <FormField id="informacoes" label="Resumo do evento" description="Uma apresentação curta para a página pública. Você poderá editar depois.">
                  <textarea id="informacoes" name="informacoes" rows={4} className={fieldClass} />
                </FormField>
              </div>
            </section>

            <section className={panelClass} aria-labelledby="event-files-title">
              <h2 id="event-files-title" className="font-mc-display text-xl font-semibold text-mc-text-primary">Arquivos públicos</h2>
              <p className="mt-1 font-mc-interface text-sm text-mc-text-secondary">Opcionais agora. Até 10 MB por arquivo.</p>
              <div className="mt-4 rounded-mc-medium border border-dashed border-mc-border bg-mc-surface-secondary/60 p-4">
                <FilePicker name="banner" label="Banner do evento" accessibleName="Banner" accept="image/jpeg,image/png,image/webp" hint="JPEG, PNG ou WebP · até 10 MB" action="Selecionar imagem" />
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-mc-medium border border-mc-border p-4">
                  <FilePicker name="regulamento" label="Regulamento" accessibleName="Regulamento" accept="application/pdf" hint="PDF · até 10 MB" action="Selecionar PDF" />
                </div>
                <div className="rounded-mc-medium border border-mc-border p-4">
                  <FilePicker name="tabela_peso" label="Tabela de peso" accessibleName="Tabela de peso" accept="application/pdf" hint="PDF · até 10 MB" action="Selecionar PDF" />
                </div>
              </div>
            </section>

            <section className={panelClass} aria-labelledby="event-phases-title">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 id="event-phases-title" className="font-mc-display text-xl font-semibold text-mc-text-primary">Datas e fases</h2>
                  <p className="mt-1 max-w-2xl font-mc-interface text-sm text-mc-text-secondary">O campeonato nasce com inscrição, pagamento, checagem e chaves. Informe as datas agora, em ordem e sem sobreposição.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  aria-expanded={phasesOpen}
                  aria-controls="event-phases"
                  onClick={() => setPhasesOpen((open) => !open)}
                >
                  Configurar datas das fases
                  <ChevronDown aria-hidden="true" size={16} className={`ml-2 transition-transform ${phasesOpen ? 'rotate-180' : ''}`} />
                </Button>
              </div>
              <div id="event-phases" hidden={!phasesOpen} className="mt-4 space-y-3">
                {errors.phases ? <Alert variant="error" role="alert">{errors.phases}</Alert> : null}
                {phases.map(([value, label]) => (
                  <fieldset key={value} className="rounded-mc-medium border border-mc-border p-4">
                    <legend className="px-1 font-mc-interface text-sm font-semibold text-mc-text-primary">{label}</legend>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="space-y-1.5 font-mc-interface text-sm font-semibold text-mc-text-primary">
                        Início
                        <Input name={`${value}_inicio`} type="datetime-local" aria-invalid={Boolean(errors.phases)} />
                      </label>
                      <label className="space-y-1.5 font-mc-interface text-sm font-semibold text-mc-text-primary">
                        Término
                        <Input name={`${value}_fim`} type="datetime-local" aria-invalid={Boolean(errors.phases)} />
                      </label>
                    </div>
                  </fieldset>
                ))}
              </div>
            </section>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Link href="/admin/eventos" className="inline-flex min-h-11 items-center justify-center rounded-mc-medium px-4 font-mc-interface text-sm font-semibold text-mc-text-secondary hover:text-mc-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2">
                Cancelar
              </Link>
              <Button type="submit" size="large" disabled={pending} aria-busy={pending} className="w-full sm:w-auto">
                {pending ? 'Criando evento...' : 'Criar evento e continuar'}
              </Button>
            </div>
          </>
        )}
        aside={(
          <aside className={panelClass} aria-labelledby="after-create-title">
            <h2 id="after-create-title" className="font-mc-display text-xl font-semibold text-mc-text-primary">Depois de criar</h2>
            <ol className="mt-4 space-y-3 font-mc-interface text-sm text-mc-text-secondary">
              <li className="flex gap-3"><span className="font-mc-display font-semibold text-mc-structure">1</span><span>Configure categorias</span></li>
              <li className="flex gap-3"><span className="font-mc-display font-semibold text-mc-structure">2</span><span>Complete a página pública</span></li>
              <li className="flex gap-3"><span className="font-mc-display font-semibold text-mc-structure">3</span><span>Revise datas e inscrições</span></li>
              <li className="flex gap-3"><span className="font-mc-display font-semibold text-mc-structure">4</span><span>Publique quando estiver pronto</span></li>
            </ol>
          </aside>
        )}
      />
    </form>
  )
}
