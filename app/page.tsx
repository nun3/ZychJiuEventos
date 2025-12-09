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
      <div id="eventos" className="w-full bg-white min-h-screen" style={{ overflow: 'visible' }}>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-5 md:px-6 lg:px-8 py-8 sm:py-10 md:py-12" style={{ overflow: 'visible' }}>
          <EventFilters />
          <ModernEventGrid />
        </div>
      </div>
      <ModernFooter />
    </main>
  )
}

