import ModernNavbar from '@/components/ModernNavbar'
import ModernFooter from '@/components/ModernFooter'
import { HomePlatformSection } from '@/components/HomePlatformSection'
import { getPublicEvents } from '@/lib/events/public-events'
import { getHomeHighlightRules, getHomeHighlights } from '@/lib/home/highlights'
import HomeClient from './HomeClient'

export default async function Home({ searchParams }: { searchParams?: { q?: string | string[] } }) {
  const query = searchParams?.q
  const initialSearch = (Array.isArray(query) ? query[0] : query)?.trim() || ''
  const highlightRulesPromise = getHomeHighlightRules()
  const events = await getPublicEvents()
  const highlights = await getHomeHighlights(events, 5, await highlightRulesPromise)
  return <main id="conteudo-principal" className="relative min-h-screen bg-mc-background"><ModernNavbar /><HomeClient key={initialSearch} initialSearch={initialSearch} events={events} highlights={highlights} /><HomePlatformSection /><ModernFooter /></main>
}
