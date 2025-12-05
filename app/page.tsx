import ModernNavbar from '@/components/ModernNavbar'
import ModernHero from '@/components/ModernHero'
import EventFilters from '@/components/EventFilters'
import ModernEventGrid from '@/components/ModernEventGrid'
import ModernFooter from '@/components/ModernFooter'

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f8fafc] relative">
      <ModernNavbar />
      <ModernHero />
      <div id="eventos" className="container mx-auto px-6 py-12">
        <EventFilters />
        <ModernEventGrid />
      </div>
      <ModernFooter />
    </main>
  )
}

