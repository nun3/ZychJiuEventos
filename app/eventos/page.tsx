import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import ModernNavbar from '@/components/ModernNavbar'
import ModernFooter from '@/components/ModernFooter'
import { EventsCatalog } from '@/components/events/EventsCatalog'
import { EventsFeaturedStage } from '@/components/events/EventsFeaturedStage'
import { InteractiveChampionshipDemo } from '@/components/home-cinematic/InteractiveChampionshipDemo'
import { getCinematicPreviewEvents } from '@/lib/home/cinematic-preview-events'
import { getPublicEvents } from '@/lib/events/public-events'

export const metadata: Metadata = {
  title: 'Eventos | Meu Camp',
  description: 'Calendário público de campeonatos do MEU CAMP e demonstração interativa sem cadastro.',
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams?: { q?: string | string[] }
}) {
  const rawQuery = searchParams?.q
  const initialSearch = (Array.isArray(rawQuery) ? rawQuery[0] : rawQuery)?.trim() || ''
  const published = await getPublicEvents()
  const preview = published.length === 0 && process.env.NODE_ENV === 'development'
  const events = preview ? getCinematicPreviewEvents() : published

  return (
    <main id="conteudo-principal" className="min-h-screen overflow-x-clip bg-mc-background pt-16">
      <ModernNavbar />

      <EventsFeaturedStage events={events} />
      <EventsCatalog events={events} initialSearch={initialSearch} preview={preview} />
      <InteractiveChampionshipDemo />

      <section className="border-t border-mc-border bg-mc-surface py-12">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 sm:px-8 lg:px-12 xl:px-20">
          <div>
            <p className="font-mc-interface text-xs font-semibold uppercase tracking-[0.16em] text-mc-action">
              Pronto para organizar seu evento real?
            </p>
            <h2 className="mt-1 font-mc-display text-2xl font-bold text-mc-text-primary">
              <span className="-mb-[0.1em] block overflow-hidden pb-[0.1em]">
                <span data-mc-line className="block will-change-transform">
                  Leve sua competição do rascunho ao placar oficial.
                </span>
              </span>
            </h2>
          </div>
          <Link
            href="/login?mode=register&redirectTo=%2Fadmin%2Feventos%2Fnovo"
            className="inline-flex min-h-11 items-center gap-2 rounded-mc-medium bg-mc-action px-5 font-mc-interface text-sm font-bold uppercase tracking-[0.12em] text-white hover:bg-blue-500"
          >
            Criar evento real
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>
      </section>

      <ModernFooter />
    </main>
  )
}
