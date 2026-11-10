import Image from 'next/image'
import ModernNavbar from '@/components/ModernNavbar'
import ModernFooter from '@/components/ModernFooter'
import { HomeCatalog } from '@/components/home-landing/HomeCatalog'
import { HomeCoverFlow } from '@/components/home-landing/HomeCoverFlow'
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
    // Sem fundo próprio no <main>: a arte fixa abaixo precisa aparecer através dos cards de vidro.
    <main id="conteudo-principal" className="relative min-h-screen overflow-x-clip text-white">
      <div aria-hidden="true" className="fixed inset-0 -z-10 bg-mc-nav-dark">
        <Image
          src="/images/home/home-bg.jpeg"
          alt=""
          fill
          priority
          quality={90}
          sizes="100vw"
          className="object-cover object-bottom"
        />
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_40%,transparent_40%,rgba(4,6,14,0.55)_100%),linear-gradient(to_bottom,rgba(4,6,14,0.55),transparent_18%,transparent_62%,rgba(4,6,14,0.78))]" />
      </div>

      <ModernNavbar overlayAtTop scrolledTone="glass" />
      <HomeCoverFlow events={featured} />
      <HomeCatalog events={events} initialSearch={initialSearch} />
      <ModernFooter />
    </main>
  )
}
