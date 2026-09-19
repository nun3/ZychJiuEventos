import ModernNavbar from '@/components/ModernNavbar'
import ModernFooter from '@/components/ModernFooter'
import { getPublicEvents } from '@/lib/events/public-events'
import HomeClient from './HomeClient'

export default async function Home() {
  const events = await getPublicEvents()
  return <main className="relative min-h-screen bg-mc-background"><ModernNavbar /><HomeClient events={events} /><ModernFooter /></main>
}
