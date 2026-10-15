import { NextResponse } from 'next/server'
import { allowsPublicOrganization } from '@/lib/events/public-organization'
import { PAYMENT_RECEIPT_BUCKET, PAYMENT_RECEIPT_SIGNED_URL_SECONDS } from '@/lib/finance/payment-receipt'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const privateHeaders = {
  'Cache-Control': 'private, no-store, max-age=0',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow',
}

function notFound() {
  return new NextResponse('Comprovante indisponível.', { status: 404, headers: privateHeaders })
}

// URL assinada curta, gerada com a sessão do usuário: a policy do Storage decide o acesso.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  if (!uuid.test(params.id)) return notFound()
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Sessão expirada.', { status: 401, headers: privateHeaders })

  const { data: receipt } = await supabase
    .from('payment_receipts')
    .select('storage_path, organization_id')
    .eq('id', params.id)
    .maybeSingle()
  if (!receipt || !allowsPublicOrganization(receipt.organization_id)) return notFound()

  const { data, error } = await supabase.storage
    .from(PAYMENT_RECEIPT_BUCKET)
    .createSignedUrl(receipt.storage_path, PAYMENT_RECEIPT_SIGNED_URL_SECONDS)
  if (error || !data?.signedUrl) return notFound()

  const response = NextResponse.redirect(data.signedUrl, 303)
  for (const [name, value] of Object.entries(privateHeaders)) response.headers.set(name, value)
  return response
}
