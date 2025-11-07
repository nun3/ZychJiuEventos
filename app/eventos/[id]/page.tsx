import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppWidget from '@/components/WhatsAppWidget'
import EventDetails from '@/components/EventDetails'

export default function EventPage({ params }: { params: { id: string } }) {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="pt-20">
        <EventDetails eventId={params.id} />
      </div>
      <Footer />
      <WhatsAppWidget />
    </main>
  )
}

