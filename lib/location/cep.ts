export type CepLookupStatus = 'idle' | 'loading' | 'found' | 'not_found' | 'unavailable'

export type CepAddress = {
  cep: string
  logradouro: string
  bairro: string
  cidade: string
  uf: string
}

export type VenueFields = {
  nome: string
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
  latitude: number | null
  longitude: number | null
}

/** Mantém apenas dígitos (máx. 8). */
export function sanitizeCep(value: string): string {
  return String(value || '').replace(/\D/g, '').slice(0, 8)
}

/** Máscara visual `00000-000`. */
export function formatCepMask(value: string): string {
  const digits = sanitizeCep(value)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

export function isCompleteCep(value: string): boolean {
  return sanitizeCep(value).length === 8
}

export function formatVenueLocal(fields: Pick<
  VenueFields,
  'nome' | 'logradouro' | 'numero' | 'complemento' | 'bairro' | 'cidade' | 'uf' | 'cep'
>): string {
  const cep = sanitizeCep(fields.cep)
  const cepLabel = cep.length === 8 ? formatCepMask(cep) : ''
  const street = [fields.logradouro, fields.numero].filter(Boolean).join(', ')
  const withComplement = fields.complemento ? `${street}${street ? ' · ' : ''}${fields.complemento}` : street
  const cityUf = [fields.cidade, fields.uf].filter(Boolean).join('/')
  const parts = [
    fields.nome.trim(),
    withComplement.trim(),
    fields.bairro.trim(),
    cityUf.trim(),
    cepLabel ? `CEP ${cepLabel}` : '',
  ].filter(Boolean)
  return parts.join(' · ')
}

export function venueHasMappableAddress(fields: Pick<VenueFields, 'logradouro' | 'cidade' | 'uf' | 'latitude' | 'longitude'>): boolean {
  if (typeof fields.latitude === 'number' && typeof fields.longitude === 'number') return true
  return Boolean(fields.logradouro.trim() && fields.cidade.trim() && fields.uf.trim())
}

export function openStreetMapEmbedUrl(lat: number, lon: number, delta = 0.012): string {
  const left = lon - delta
  const right = lon + delta
  const top = lat + delta
  const bottom = lat - delta
  const bbox = `${left}%2C${bottom}%2C${right}%2C${top}`
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}`
}

export function openStreetMapExternalUrl(lat: number, lon: number): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`
}
