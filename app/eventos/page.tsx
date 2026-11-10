import ModernNavbar from '@/components/ModernNavbar'
import { HomeCatalog } from '@/components/home-landing/HomeCatalog'
import { HomeCoverFlow } from '@/components/home-landing/HomeCoverFlow'
import { SiteFooter } from '@/components/SiteFooter'
import { WhatsAppFloat } from '@/components/WhatsAppFloat'
import { isPastCatalogEvent } from '@/lib/events/catalog-presentation'
import { getPublicEvents } from '@/lib/events/public-events'
import { getHomeHighlightRules, getHomeHighlights } from '@/lib/home/highlights'

const FEATURED_LIMIT = 5

export default async function Home({
  searchParams,
}: {
  searchParams?: { q?: string | string[] }
}) {
  // A busca da Home é a do calendário abaixo; `?q=` pré-preenche o campo (antes redirecionava para /eventos).
  const query = searchParams?.q
  const initialSearch = (Array.isArray(query) ? query[0] : query)?.trim() || ''

  const highlightRulesPromise = getHomeHighlightRules()
  const events = await getPublicEvents()
  const highlights = await getHomeHighlights(events, FEATURED_LIMIT, await highlightRulesPromise)
  // Sem destaques curados, o palco usa os próximos campeonatos; sem nenhum evento, mostra só as frases de luta.
  const featured = highlights.length
    ? highlights
    : events.filter((event) => !isPastCatalogEvent(event.dateObj)).slice(0, FEATURED_LIMIT)

  return (
    <main id="conteudo-principal" className="relative min-h-screen overflow-x-clip text-white">
      <div aria-hidden="true" className="fixed inset-0 -z-10 bg-white" />

      <ModernNavbar />
      <HomeCoverFlow events={featured} />
      <HomeCatalog events={events} initialSearch={initialSearch} />
      <SiteFooter />
      <WhatsAppFloat />
    </main>
  )
}
