import Link from 'next/link'
import { FiArrowLeft } from 'react-icons/fi'
import NewEventForm from './NewEventForm'

export default function NewEventPage() {
  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <div className="container mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/admin/eventos" aria-label="Voltar para eventos" className="text-gray-600 hover:text-primary-blue"><FiArrowLeft size={20} /></Link>
          <div><h1 className="text-3xl font-bold text-gray-900">Criar evento</h1><p className="text-gray-600">Dados, fuso e cronograma persistidos no Supabase.</p></div>
        </div>
        <NewEventForm />
      </div>
    </main>
  )
}
