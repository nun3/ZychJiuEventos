import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppWidget from '@/components/WhatsAppWidget'
import HeroSection from '@/components/HeroSection'
import EventFilters from '@/components/EventFilters'
import EventGrid from '@/components/EventGrid'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="pt-20">
        <HeroSection />
        <div className="container mx-auto px-4 py-8">
          <EventFilters />
          <EventGrid />
        </div>
      </div>
      <Footer />
      <WhatsAppWidget />
    </main>
  )
}

