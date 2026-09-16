import 'server-only'

import { unstable_noStore as noStore } from 'next/cache'
import type { Event } from '@/components/ModernEventGrid'
import { createClient } from '@/lib/supabase/server'

const publicStatuses = ['publicado', 'inscricao', 'pagamento', 'checagem', 'chaves', 'em_andamento', 'concluido'] as const

export async function getPublicEvents(): Promise<Event[]> {
  noStore()

  const { data } = await createClient()
    .from('events')
    .select('id, nome, data_evento, local, informacoes, imagem_cartaz_url')
    .in('status', publicStatuses)
    .order('data_evento', { ascending: true })

  const formatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', timeZone: 'UTC' })
  const fullFormatter = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' })
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (data || []).map((event) => {
    const date = new Date(`${event.data_evento}T12:00:00Z`)

    return {
      id: event.id,
      title: event.nome,
      type: 'Campeonato Jiu-Jitsu',
      eventType: 'Campeonato',
      sport: 'Jiu-Jitsu',
      state: event.local.match(/\/([A-Z]{2})$/)?.[1] || 'Todos',
      date: formatter.format(date),
      dateFull: fullFormatter.format(date),
      dateObj: event.data_evento,
      location: event.local,
      daysLeft: Math.max(0, Math.ceil((date.getTime() - today.getTime()) / 86400000)),
      image: event.imagem_cartaz_url || undefined,
      description: event.informacoes || undefined,
    }
  })
}
