import { NextResponse } from 'next/server'
import { lookupCep } from '@/lib/location/lookup'
import { sanitizeCep } from '@/lib/location/cep'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cep = sanitizeCep(searchParams.get('cep') || '')
  if (cep.length !== 8) {
    return NextResponse.json({ ok: false, reason: 'invalid' }, { status: 400 })
  }
  const result = await lookupCep(cep)
  if (!result.ok) {
    const status = result.reason === 'unavailable' ? 503 : result.reason === 'not_found' ? 404 : 400
    return NextResponse.json({ ok: false, reason: result.reason }, { status })
  }
  return NextResponse.json({ ok: true, address: result.address })
}
