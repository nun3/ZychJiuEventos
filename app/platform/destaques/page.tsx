import Image from 'next/image'
import { redirect } from 'next/navigation'
import { ImageOff, Star } from 'lucide-react'
import { requirePlatformAdmin } from '@/lib/auth/platform-admin-server'
import { publicEventStatuses } from '@/lib/events/public-access'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageContainer } from '@/components/ui/PageContainer'
import { PageHeader } from '@/components/ui/PageHeader'
import { removeHighlight, saveHighlight } from './actions'

function inputDate(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export default async function PlatformHighlightsPage() {
  const access = await requirePlatformAdmin()
  if (access.status === 'unauthenticated') redirect('/login?redirectTo=/platform/destaques')
  if (access.status === 'forbidden') redirect('/dashboard?erro=sem_permissao')

  const [{ data: events }, { data: highlights }] = await Promise.all([
    access.supabase.from('events').select('id, nome, data_evento, local, status, imagem_cartaz_url').in('status', publicEventStatuses).order('data_evento'),
    access.supabase.from('home_event_highlights').select('event_id, position, pinned, hidden, starts_at, ends_at').order('position'),
  ])
  const rules = new Map((highlights || []).map((rule) => [rule.event_id, rule]))

  return (
    <main className="py-mc-32 sm:py-mc-48">
      <PageContainer>
        <PageHeader title="Destaques da Home" description="Faça a curadoria global sem duplicar os dados dos eventos. Eventos sem banner permanecem fora do carrossel." />
        {!events?.length ? (
          <EmptyState icon={<Star size={34} />} title="Nenhum evento elegível" description="Publique um evento para disponibilizá-lo à curadoria." className="mt-mc-32 rounded-mc-medium border border-mc-border bg-mc-surface" />
        ) : (
          <div className="mt-mc-32 space-y-mc-16">
            {events.map((event, index) => {
              const rule = rules.get(event.id)
              const hasBanner = Boolean(event.imagem_cartaz_url)
              return (
                <Card key={event.id} className="grid gap-mc-16 p-mc-16 lg:grid-cols-[12rem_minmax(0,1fr)] lg:p-mc-24">
                  <div className="relative aspect-video overflow-hidden rounded-mc-small bg-mc-structure">
                    {event.imagem_cartaz_url ? <Image src={event.imagem_cartaz_url} alt="" fill sizes="192px" className="object-cover" /> : <div className="flex h-full items-center justify-center text-blue-200"><ImageOff aria-hidden="true" size={30} /></div>}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-mc-12">
                      <div><h2 className="font-mc-display text-mc-h3 text-mc-text-primary">{event.nome}</h2><p className="mt-mc-4 font-mc-interface text-sm text-mc-text-secondary">{event.data_evento} · {event.local} · {event.status}</p></div>
                      {!hasBanner ? <span className="font-mc-interface text-xs font-semibold uppercase text-mc-warning">Banner obrigatório</span> : null}
                    </div>
                    <form action={saveHighlight} className="mt-mc-16 grid gap-mc-12 md:grid-cols-2 xl:grid-cols-4">
                      <input type="hidden" name="event_id" value={event.id} />
                      <label className="font-mc-interface text-sm font-semibold text-mc-text-primary">Posição<input name="position" type="number" min="1" defaultValue={rule?.position || index + 1} className="mt-mc-4 min-h-11 w-full rounded-mc-small border border-mc-border px-mc-12" /></label>
                      <label className="font-mc-interface text-sm font-semibold text-mc-text-primary">Início<input name="starts_at" type="datetime-local" defaultValue={inputDate(rule?.starts_at || null)} className="mt-mc-4 min-h-11 w-full rounded-mc-small border border-mc-border px-mc-12" /></label>
                      <label className="font-mc-interface text-sm font-semibold text-mc-text-primary">Fim<input name="ends_at" type="datetime-local" defaultValue={inputDate(rule?.ends_at || null)} className="mt-mc-4 min-h-11 w-full rounded-mc-small border border-mc-border px-mc-12" /></label>
                      <div className="flex flex-wrap items-center gap-mc-16 md:col-span-2 xl:col-span-1">
                        <label className="inline-flex items-center gap-mc-8 font-mc-interface text-sm"><input name="pinned" type="checkbox" defaultChecked={rule?.pinned ?? true} /> Fixar</label>
                        <label className="inline-flex items-center gap-mc-8 font-mc-interface text-sm"><input name="hidden" type="checkbox" defaultChecked={rule?.hidden ?? false} /> Ocultar</label>
                      </div>
                      <div className="flex flex-wrap gap-mc-12 md:col-span-2 xl:col-span-4">
                        <button type="submit" disabled={!hasBanner} className="min-h-11 rounded-mc-small bg-mc-action px-mc-16 font-mc-interface text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{rule ? 'Salvar destaque' : 'Destacar evento'}</button>
                        {rule ? <button formAction={removeHighlight} type="submit" className="min-h-11 px-mc-12 font-mc-interface text-sm font-semibold text-mc-error hover:underline">Remover destaque</button> : null}
                      </div>
                    </form>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </PageContainer>
    </main>
  )
}
