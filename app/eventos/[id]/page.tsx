import ModernNavbar from '@/components/ModernNavbar'
import ModernFooter from '@/components/ModernFooter'
import EventDetails from '@/components/EventDetails'

export default function EventPage({ params }: { params: { id: string } }) {
  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <ModernNavbar />
      <div className="pt-20">
        <EventDetails eventId={params.id} />
      </div>
      <ModernFooter />
    </main>
  )
}

