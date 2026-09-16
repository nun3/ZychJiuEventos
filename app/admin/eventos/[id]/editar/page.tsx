import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EditEventForm from './EditEventForm'

export default async function EditEventPage({ params }: { params: { id: string } }) {
  const { data: event } = await createClient().from('events').select('id, nome, data_evento, local, timezone, valor_inscricao, informacoes, status').eq('id', params.id).maybeSingle()
  if (!event || event.status !== 'rascunho') notFound()
  return <main className="min-h-screen bg-gray-50"><div className="container mx-auto max-w-4xl px-6 py-8"><h1 className="mb-6 text-3xl font-bold">Editar rascunho</h1><EditEventForm event={event} /></div></main>
}
