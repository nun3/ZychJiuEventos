import { formatCepMask, sanitizeCep, type CepAddress } from './cep'

type ViaCepResponse = {
  erro?: boolean
  cep?: string
  logradouro?: string
  bairro?: string
  localidade?: string
  uf?: string
}

export type CepLookupResult =
  | { ok: true; address: CepAddress }
  | { ok: false; reason: 'invalid' | 'not_found' | 'unavailable' }

export type GeocodePrecision = 'exact' | 'approximate'

export type GeocodeResult =
  | { ok: true; latitude: number; longitude: number; precision: GeocodePrecision }
  | { ok: false; reason: 'unavailable' | 'not_found' }

export type GeocodeCandidate = {
  query: string
  precision: GeocodePrecision
}

/** Consulta ViaCEP. Destinado a uso server-side / route handlers. */
export async function lookupCep(rawCep: string, fetchImpl: typeof fetch = fetch): Promise<CepLookupResult> {
  const cep = sanitizeCep(rawCep)
  if (cep.length !== 8) return { ok: false, reason: 'invalid' }
  try {
    const response = await fetchImpl(`https://viacep.com.br/ws/${cep}/json/`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 0 },
    } as RequestInit)
    if (!response.ok) return { ok: false, reason: 'unavailable' }
    const data = (await response.json()) as ViaCepResponse
    if (data.erro) return { ok: false, reason: 'not_found' }
    if (!data.localidade || !data.uf) return { ok: false, reason: 'not_found' }
    return {
      ok: true,
      address: {
        cep: formatCepMask(cep),
        logradouro: String(data.logradouro || '').trim(),
        bairro: String(data.bairro || '').trim(),
        cidade: String(data.localidade || '').trim(),
        uf: String(data.uf || '').trim().toUpperCase(),
      },
    }
  } catch {
    return { ok: false, reason: 'unavailable' }
  }
}

export function buildGeocodeCandidates(input: {
  logradouro: string
  numero?: string
  bairro?: string
  cidade: string
  uf: string
  cep?: string
}): GeocodeCandidate[] {
  const cidade = input.cidade.trim()
  const uf = input.uf.trim().toUpperCase()
  if (!cidade || !uf) return []

  const logradouro = input.logradouro.trim()
  const numero = (input.numero || '').trim()
  const bairro = (input.bairro || '').trim()
  const cepDigits = sanitizeCep(input.cep || '')
  const cepMasked = cepDigits.length === 8 ? formatCepMask(cepDigits) : ''

  const raw: Array<GeocodeCandidate | null> = [
    logradouro && numero
      ? { query: [logradouro, numero, bairro, cidade, uf, 'Brasil'].filter(Boolean).join(', '), precision: 'exact' }
      : null,
    logradouro
      ? { query: [logradouro, cidade, uf, 'Brasil'].filter(Boolean).join(', '), precision: 'exact' }
      : null,
    bairro
      ? { query: [bairro, cidade, uf, 'Brasil'].filter(Boolean).join(', '), precision: 'approximate' }
      : null,
    cepMasked
      ? { query: [cepMasked, cidade, uf, 'Brasil'].filter(Boolean).join(', '), precision: 'approximate' }
      : null,
    { query: [cidade, uf, 'Brasil'].join(', '), precision: 'approximate' },
  ]

  const seen = new Set<string>()
  const unique: GeocodeCandidate[] = []
  for (const item of raw) {
    if (!item || !item.query || seen.has(item.query)) continue
    seen.add(item.query)
    unique.push(item)
  }
  return unique
}

export function buildGeocodeCandidateQueries(input: {
  logradouro: string
  numero?: string
  bairro?: string
  cidade: string
  uf: string
  cep?: string
}): string[] {
  return buildGeocodeCandidates(input).map((item) => item.query)
}

/** Geocode via Nominatim (OpenStreetMap). Server-side only, with progressive fallback. */
export async function geocodeAddress(
  input: { logradouro: string; numero?: string; bairro?: string; cidade: string; uf: string; cep?: string },
  fetchImpl: typeof fetch = fetch,
): Promise<GeocodeResult> {
  const candidates = buildGeocodeCandidates(input)
  if (!candidates.length) return { ok: false, reason: 'not_found' }

  for (const candidate of candidates) {
    try {
      const url = new URL('https://nominatim.openstreetmap.org/search')
      url.searchParams.set('format', 'json')
      url.searchParams.set('limit', '1')
      url.searchParams.set('countrycodes', 'br')
      url.searchParams.set('q', candidate.query)
      const response = await fetchImpl(url.toString(), {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'MEU-CAMP/1.0 (event-venue-geocode)',
        },
        // O endereço de um local quase não muda: cache de 1 dia e limite de espera (a página do evento não pode depender disso).
        next: { revalidate: 86400 },
        signal: AbortSignal.timeout(3500),
      } as RequestInit)
      if (!response.ok) return { ok: false, reason: 'unavailable' }
      const data = (await response.json()) as Array<{ lat?: string; lon?: string }>
      const first = data[0]
      const latitude = Number(first?.lat)
      const longitude = Number(first?.lon)
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        return { ok: true, latitude, longitude, precision: candidate.precision }
      }
    } catch {
      return { ok: false, reason: 'unavailable' }
    }
  }

  return { ok: false, reason: 'not_found' }
}
