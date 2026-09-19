import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import { ArrowLeft, CalendarDays, ClipboardList, Clock3, Download, FileText, GitBranch, MapPin, Trophy, UsersRound } from 'lucide-react'
import ModernNavbar from '@/components/ModernNavbar'
import ModernFooter from '@/components/ModernFooter'
import { Card, PageContainer, PageHeader, StatusBadge } from '@/components/ui'
import { formatFightDurationLabel, parseFightDurationMinutes } from '@/lib/events/fight-duration'
import { findPublicReleaseEvent } from '@/lib/events/public-access'
import { createClient } from '@/lib/supabase/server'

const statusVariants = {
  rascunho: 'neutral',
  publicado: 'info',
  inscricao: 'success',
  pagamento: 'warning',
  checagem: 'info',
  chaves: 'info',
  em_andamento: 'success',
  concluido: 'neutral',
  cancelado: 'error',
} as const

export default async function EventPage({ params }: { params: { id: string } }) {
  noStore()
  const supabase = createClient()
  const event = await findPublicReleaseEvent(params.id)
  if (!event) notFound()
  const [{ data: phases }, { data: rules }] = await Promise.all([
    supabase.from('event_phases').select('id, tipo, inicio, fim').eq('event_id', event.id).order('inicio'),
    supabase.from('category_rule_sets').select('id, nome, versao, event_categories(id, nome, genero, idade_min, idade_max, peso_min_kg, peso_max_kg, fight_duration_minutes)').eq('event_id', event.id).eq('ativo', true).order('versao', { ascending: false }).limit(1),
  ])
  const date = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${event.data_evento}T12:00:00Z`))
  const dateTime = (value: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: event.timezone }).format(new Date(value))

  return (
    <main className="min-h-screen bg-mc-background">
      <ModernNavbar />
      <PageContainer className="pb-mc-64 pt-32 sm:pt-36">
        <Link
          href="/"
          className="inline-flex min-h-10 items-center gap-2 rounded-mc-small px-2 font-mc-interface text-sm font-semibold text-mc-action transition-colors duration-mc-normal hover:bg-mc-action/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          Voltar para eventos
        </Link>

        <article className="mt-mc-24">
          <PageHeader
            className="mb-mc-32"
            title={event.nome}
            description="Informações, cronograma e categorias oficiais desta competição."
            actions={
              <StatusBadge variant={statusVariants[event.status]}>
                {event.status.replace('_', ' ')}
              </StatusBadge>
            }
          />

          <div className="grid items-start gap-mc-24 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="space-y-mc-24">
              {event.imagem_cartaz_url ? (
                <Card className="overflow-hidden bg-mc-surface-secondary shadow-mc-subtle">
                  <div className="relative h-64 w-full sm:h-80 lg:h-[30rem]">
                    <Image
                      src={event.imagem_cartaz_url}
                      alt={`Banner de ${event.nome}`}
                      fill
                      unoptimized
                      className="object-contain p-mc-16"
                      sizes="(max-width: 1024px) 100vw, 760px"
                    />
                  </div>
                </Card>
              ) : null}

              <Card className="p-0 shadow-mc-subtle">
                <section aria-label="Informações principais" className="grid sm:grid-cols-2">
                  <div className="flex gap-mc-12 p-mc-16 sm:border-r sm:border-mc-border">
                    <CalendarDays aria-hidden="true" className="mt-0.5 shrink-0 text-mc-action" size={22} />
                    <div>
                      <p className="font-mc-interface text-mc-caption font-semibold uppercase tracking-wide text-mc-text-secondary">Data do evento</p>
                      <p className="mt-mc-4 font-mc-interface text-mc-body font-semibold text-mc-text-primary">{date}</p>
                    </div>
                  </div>
                  <div className="flex gap-mc-12 border-t border-mc-border p-mc-16 sm:border-t-0">
                    <MapPin aria-hidden="true" className="mt-0.5 shrink-0 text-mc-action" size={22} />
                    <div>
                      <p className="font-mc-interface text-mc-caption font-semibold uppercase tracking-wide text-mc-text-secondary">Local</p>
                      <p className="mt-mc-4 font-mc-interface text-mc-body font-semibold text-mc-text-primary">{event.local}</p>
                    </div>
                  </div>
                </section>
              </Card>

              {event.informacoes ? (
                <Card className="p-mc-24 sm:p-mc-32">
                  <div className="flex items-center gap-mc-8">
                    <FileText aria-hidden="true" className="text-mc-action" size={22} />
                    <h2 className="font-mc-display text-mc-h2 text-mc-text-primary">Sobre o evento</h2>
                  </div>
                  <p className="mt-mc-16 whitespace-pre-line font-mc-interface text-mc-body text-mc-text-secondary">{event.informacoes}</p>
                </Card>
              ) : null}

              <Card className="p-mc-24 sm:p-mc-32">
                <div className="flex items-center gap-mc-8">
                  <Clock3 aria-hidden="true" className="text-mc-action" size={22} />
                  <h2 className="font-mc-display text-mc-h2 text-mc-text-primary">Cronograma</h2>
                </div>
                {phases?.length ? (
                  <div className="mt-mc-16 grid md:grid-cols-2 md:gap-x-mc-24">
                    {phases.map((phase) => (
                      <div key={phase.id} className="border-b border-mc-border py-mc-16 first:pt-0 last:border-b-0 md:[&:nth-last-child(2)]:border-b-0 md:[&:nth-child(even)]:pl-mc-24 md:[&:nth-child(odd)]:pr-mc-24 md:[&:nth-child(even)]:border-l md:[&:nth-child(even)]:border-mc-border">
                        <p className="font-mc-interface text-mc-small font-semibold capitalize text-mc-text-primary">{phase.tipo}</p>
                        <p className="mt-mc-4 font-mc-interface text-mc-caption text-mc-text-secondary">{dateTime(phase.inicio)} até {dateTime(phase.fim)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-mc-16 font-mc-interface text-mc-small text-mc-text-secondary">O cronograma será divulgado pela organização do evento.</p>
                )}
              </Card>

              {rules?.[0] ? (
                <Card className="p-mc-24 sm:p-mc-32">
                  <div className="flex items-center gap-mc-8">
                    <UsersRound aria-hidden="true" className="text-mc-action" size={22} />
                    <h2 className="font-mc-display text-mc-h2 text-mc-text-primary">Categorias — versão {rules[0].versao}</h2>
                  </div>
                  <ul className="mt-mc-16 grid gap-mc-12 md:grid-cols-2">
                    {rules[0].event_categories.map((category) => {
                      const duration = formatFightDurationLabel(parseFightDurationMinutes(category.fight_duration_minutes), 'long')
                      return (
                      <li key={category.id} className="rounded-mc-small border border-mc-border bg-mc-surface-secondary p-mc-16">
                        <p className="font-mc-interface text-mc-small font-semibold text-mc-text-primary">{category.nome}</p>
                        <p className="mt-mc-4 font-mc-interface text-mc-caption text-mc-text-secondary">
                          {category.genero} · {category.idade_min}–{category.idade_max} anos · {category.peso_min_kg}–{category.peso_max_kg} kg
                          {duration ? ` · ${duration}` : ''}
                        </p>
                      </li>
                      )
                    })}
                  </ul>
                </Card>
              ) : null}

              {event.regulamento_url || event.tabela_peso_url ? (
                <section aria-label="Documentos do evento" className="flex flex-wrap gap-mc-12">
                  {event.regulamento_url ? (
                    <a href={event.regulamento_url} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-mc-medium border border-mc-border bg-mc-surface px-mc-16 font-mc-interface text-sm font-semibold text-mc-text-primary transition-colors duration-mc-normal hover:bg-mc-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2">
                      <Download aria-hidden="true" size={18} />
                      Regulamento
                    </a>
                  ) : null}
                  {event.tabela_peso_url ? (
                    <a href={event.tabela_peso_url} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-mc-medium border border-mc-border bg-mc-surface px-mc-16 font-mc-interface text-sm font-semibold text-mc-text-primary transition-colors duration-mc-normal hover:bg-mc-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2">
                      <Download aria-hidden="true" size={18} />
                      Tabela de peso
                    </a>
                  ) : null}
                </section>
              ) : null}
            </div>

            <aside className="lg:sticky lg:top-32">
              <Card className="p-mc-24 shadow-mc-elevated">
                <Trophy aria-hidden="true" className="text-mc-action" size={28} />
                <p className="mt-mc-16 font-mc-interface text-mc-caption font-semibold uppercase tracking-wide text-mc-text-secondary">Valor da inscrição</p>
                <p className="mt-mc-4 font-mc-display text-mc-h2 text-mc-text-primary">{event.valor_inscricao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                <div className="mt-mc-24 border-t border-mc-border pt-mc-24">
                  {event.status === 'inscricao' ? (
                    <Link href={`/eventos/${event.id}/inscricao/cadastrar-atleta`} className="inline-flex min-h-12 w-full items-center justify-center rounded-mc-medium bg-mc-action px-mc-16 font-mc-interface text-base font-semibold text-white transition-colors duration-mc-normal hover:bg-mc-action/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2">
                      Inscrever atletas
                    </Link>
                  ) : (
                    <p className="font-mc-interface text-mc-small text-mc-text-secondary">Inscrições indisponíveis nesta fase.</p>
                  )}
                </div>
                <div className="mt-mc-24 space-y-mc-12 border-t border-mc-border pt-mc-24">
                  {['checagem', 'chaves', 'em_andamento', 'concluido'].includes(event.status) ? (
                    <Link href={`/eventos/${event.id}/checagem`} className="inline-flex min-h-12 w-full items-center justify-center gap-mc-8 rounded-mc-medium border border-mc-border bg-mc-surface px-mc-16 font-mc-interface text-base font-semibold text-mc-text-primary transition-colors duration-mc-normal hover:bg-mc-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2">
                      <ClipboardList aria-hidden="true" size={18} />
                      Consultar checagem
                    </Link>
                  ) : null}
                  <Link href={`/eventos/${event.id}/chaves`} className="inline-flex min-h-12 w-full items-center justify-center gap-mc-8 rounded-mc-medium border border-mc-border bg-mc-surface px-mc-16 font-mc-interface text-base font-semibold text-mc-text-primary transition-colors duration-mc-normal hover:bg-mc-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2">
                    <GitBranch aria-hidden="true" size={18} />
                    Consultar chaves
                  </Link>
                  <Link href={`/eventos/${event.id}/programacao`} className="inline-flex min-h-12 w-full items-center justify-center gap-mc-8 rounded-mc-medium border border-mc-border bg-mc-surface px-mc-16 font-mc-interface text-base font-semibold text-mc-text-primary transition-colors duration-mc-normal hover:bg-mc-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2">
                    <Clock3 aria-hidden="true" size={18} />
                    Consultar programação
                  </Link>
                  <p className="font-mc-interface text-mc-caption text-mc-text-secondary">Somente versões oficiais publicadas.</p>
                </div>
              </Card>
            </aside>
          </div>
        </article>
      </PageContainer>
      <ModernFooter />
    </main>
  )
}
