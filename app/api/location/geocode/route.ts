import { NextResponse } from 'next/server'
import { geocodeAddress } from '@/lib/location/lookup'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const logradouro = String(searchParams.get('logradouro') || '').trim()
  const numero = String(searchParams.get('numero') || '').trim()
  const bairro = String(searchParams.get('bairro') || '').trim()
  const cidade = String(searchParams.get('cidade') || '').trim()
  const uf = String(searchParams.get('uf') || '').trim()
  const cep = String(searchParams.get('cep') || '').trim()
  if (!cidade || !uf) {
    return NextResponse.json({ ok: false, reason: 'invalid' }, { status: 400 })
  }
  const result = await geocodeAddress({ logradouro, numero, bairro, cidade, uf, cep })
  if (!result.ok) {
    return NextResponse.json({ ok: false, reason: result.reason }, { status: 200 })
  }
  return NextResponse.json({
    ok: true,
    latitude: result.latitude,
    longitude: result.longitude,
    precision: result.precision,
  })
}
