import ModernNavbar from '@/components/ModernNavbar'
import ModernFooter from '@/components/ModernFooter'
import { getPublicEvents } from '@/lib/events/public-events'
import { getHomeHighlights } from '@/lib/home/highlights'
import HomeClient from './HomeClient'

export default async function Home() {
  const events = await getPublicEvents()
  const highlights = await getHomeHighlights(events)
  return <main id="conteudo-principal" className="relative min-h-screen bg-mc-background"><ModernNavbar /><HomeClient events={events} highlights={highlights} /><ModernFooter /></main>
}
