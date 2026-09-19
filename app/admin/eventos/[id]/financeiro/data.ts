import type { SupabaseClient } from '@supabase/supabase-js'
import {
  buildEventClosing,
  type ClosingRegistrationInput,
  type EventClosingReport,
  type PaymentStatus,
  type RegistrationStatus,
  type SettlementOrigin,
} from '@/lib/finance/event-closing'
import type { Database, Json } from '@/lib/supabase/database.types'

type LinkedPayment = {
  id: string
  status: PaymentStatus
  created_at: string
  payment_attempts: Array<{ id: string }> | null
}

type PaymentLink = {
  registration_id: string
  amount: number
  payment_id: string
  payments: LinkedPayment | LinkedPayment[] | null
}

function snapshotName(snapshot: Json, fallback: string) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return fallback
  const name = (snapshot as Record<string, unknown>).nome
  const fullName = (snapshot as Record<string, unknown>).nome_completo
  if (typeof fullName === 'string' && fullName.trim()) return fullName
  if (typeof name === 'string' && name.trim()) return name
  return fallback
}

function asPayment(value: PaymentLink['payments']): LinkedPayment | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] || null : value
}

function pickLinkedPayment(links: PaymentLink[]) {
  const ranked = links
    .map((link) => ({ link, payment: asPayment(link.payments) }))
    .filter((item): item is { link: PaymentLink; payment: LinkedPayment } => Boolean(item.payment))
  return ranked.find((item) => item.payment.status === 'pago')
    || ranked.find((item) => item.payment.status === 'estornado')
    || ranked.sort((left, right) => right.payment.created_at.localeCompare(left.payment.created_at))[0]
    || null
}

function resolveOrigin(payment: LinkedPayment | null, manualPaymentIds: Set<string>): SettlementOrigin {
  if (!payment) return null
  if (manualPaymentIds.has(payment.id) || ((payment.status === 'pago' || payment.status === 'estornado') && !(payment.payment_attempts || []).length)) {
    return 'baixa_manual'
  }
  if ((payment.payment_attempts || []).length) return 'pagamento_confirmado'
  return null
}

export async function loadEventClosing(
  supabase: SupabaseClient<Database>,
  eventId: string,
): Promise<EventClosingReport> {
  const { data: registrations, error: registrationError } = await supabase
    .from('registrations')
    .select('id, status, valor, athlete_snapshot, category_snapshot, created_at')
    .eq('event_id', eventId)
    .order('created_at')
  if (registrationError) throw new Error('Não foi possível carregar as inscrições do fechamento.')

  const registrationIds = (registrations || []).map((row) => row.id)
  const [{ data: links }, { data: audits }] = await Promise.all([
    registrationIds.length
      ? supabase
        .from('payment_registrations')
        .select('registration_id, amount, payment_id, payments(id, status, created_at, payment_attempts(id))')
        .in('registration_id', registrationIds)
      : Promise.resolve({ data: [] as PaymentLink[] }),
    supabase
      .from('event_audit_logs')
      .select('resource_id')
      .eq('event_id', eventId)
      .eq('action', 'payment_manually_settled'),
  ])

  const linksByRegistration = new Map<string, PaymentLink[]>()
  for (const link of (links || []) as unknown as PaymentLink[]) {
    const current = linksByRegistration.get(link.registration_id) || []
    current.push(link)
    linksByRegistration.set(link.registration_id, current)
  }
  const manualPaymentIds = new Set((audits || []).map((row) => row.resource_id).filter((id): id is string => Boolean(id)))

  const rows: ClosingRegistrationInput[] = (registrations || []).map((registration) => {
    const chosen = pickLinkedPayment(linksByRegistration.get(registration.id) || [])
    return {
      id: registration.id,
      status: registration.status as RegistrationStatus,
      athleteName: snapshotName(registration.athlete_snapshot, 'Atleta'),
      categoryName: snapshotName(registration.category_snapshot, 'Categoria'),
      paymentStatus: chosen?.payment.status ?? null,
      paymentAmount: chosen ? chosen.link.amount : null,
      settlementOrigin: resolveOrigin(chosen?.payment ?? null, manualPaymentIds),
    }
  })

  return buildEventClosing(rows)
}
