import { createClient } from '@/lib/supabase/server'
import { buildEventGuidanceSteps, buildNextAction, type EventGuidanceFacts } from './event-guidance'

export async function loadEventGuidanceFacts(eventId: string): Promise<EventGuidanceFacts | null> {
  const supabase = createClient()
  const { data: event } = await supabase
    .from('events')
    .select('id, status, checagem_travada_em')
    .eq('id', eventId)
    .maybeSingle()
  if (!event) return null

  const [{ data: activeRules }, { count: efetivadasCount }, { count: pendingCorrections }, { count: pendingCategoryChanges }, { data: publishedBracket }, { data: publishedSchedule }] = await Promise.all([
    supabase.from('category_rule_sets').select('id, event_categories(id)').eq('event_id', eventId).eq('ativo', true),
    supabase.from('registrations').select('id', { count: 'exact', head: true }).eq('event_id', eventId).eq('status', 'efetivada'),
    supabase.from('registration_correction_requests').select('id, registrations!inner(event_id)', { count: 'exact', head: true }).eq('status', 'pendente').eq('registrations.event_id', eventId),
    supabase.from('category_change_requests').select('id, registrations!inner(event_id)', { count: 'exact', head: true }).eq('status', 'pendente').eq('registrations.event_id', eventId),
    supabase.from('category_brackets').select('id').eq('event_id', eventId).in('status', ['publicada', 'em_andamento', 'concluida']).limit(1).maybeSingle(),
    supabase.from('event_schedules').select('id').eq('event_id', eventId).eq('status', 'publicada').limit(1).maybeSingle(),
  ])

  return {
    eventId: event.id,
    status: event.status,
    checkingLocked: Boolean(event.checagem_travada_em),
    hasCategory: (activeRules || []).some((rule) => (rule.event_categories || []).length > 0),
    efetivadasCount: efetivadasCount || 0,
    pendingRequestsCount: (pendingCorrections || 0) + (pendingCategoryChanges || 0),
    hasPublishedBracket: Boolean(publishedBracket),
    schedulePublished: Boolean(publishedSchedule),
  }
}

export async function loadEventGuidanceView(eventId: string) {
  const facts = await loadEventGuidanceFacts(eventId)
  if (!facts) return null
  return {
    facts,
    steps: buildEventGuidanceSteps(facts),
    action: buildNextAction(facts),
  }
}
