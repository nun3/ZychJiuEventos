import {
  formatCepMask,
  openStreetMapEmbedUrl,
  openStreetMapExternalUrl,
  sanitizeCep,
} from '@/lib/location/cep'

export type PublicVenueMapProps = {
  nome: string | null
  logradouro: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  uf: string | null
  cep: string | null
  latitude: number | null
  longitude: number | null
  precision?: 'exact' | 'approximate' | null
  fallbackLocal: string | null
  /** O mapa ainda está sendo resolvido (streaming): mostra um espaço reservado no lugar dele. */
  mapPending?: boolean
}

export function PublicEventVenueMap({
  nome,
  logradouro,
  numero,
  complemento,
  bairro,
  cidade,
  uf,
  cep,
  latitude,
  longitude,
  precision,
  fallbackLocal,
  mapPending = false,
}: PublicVenueMapProps) {
  const street = [logradouro, numero].filter(Boolean).join(', ')
  const cepLabel = sanitizeCep(cep || '').length === 8 ? formatCepMask(cep || '') : ''
  const cityUf = [cidade, uf].filter(Boolean).join('/')
  const lines = [
    nome?.trim(),
    street || null,
    complemento?.trim() || null,
    bairro?.trim() || null,
    cityUf || null,
    cepLabel ? `CEP ${cepLabel}` : null,
  ].filter(Boolean) as string[]

  const hasCoords = typeof latitude === 'number' && typeof longitude === 'number'
  const displayLines = lines.length ? lines : fallbackLocal ? [fallbackLocal] : []

  return (
    <div className="mt-8 space-y-4">
      {displayLines.length ? (
        <ul className="space-y-1 font-mc-interface text-base leading-7 text-mc-text-secondary">
          {displayLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}

      {mapPending ? <div aria-hidden="true" className="mc-skeleton h-64 w-full sm:h-80" /> : null}

      {hasCoords ? (
        <div className="space-y-3">
          {precision === 'approximate' ? (
            <p className="font-mc-interface text-sm text-mc-text-secondary">
              Mapa na região aproximada. O endereço completo acima é o gravado pela organização.
            </p>
          ) : null}
          <div className="overflow-hidden border border-mc-border bg-mc-surface-secondary">
            <iframe
              title="Mapa do local do campeonato"
              src={openStreetMapEmbedUrl(latitude, longitude)}
              className="h-64 w-full border-0 sm:h-80"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              tabIndex={-1}
            />
          </div>
          <a
            href={openStreetMapExternalUrl(latitude, longitude)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center font-mc-interface text-[11px] font-bold uppercase tracking-[0.14em] text-mc-text-primary transition-colors duration-200 hover:text-mc-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"
          >
            Abrir no mapa
          </a>
        </div>
      ) : (
        <p className="font-mc-interface text-sm text-mc-text-secondary">
          O mapa aparece quando a geolocalização do endereço estiver disponível.
        </p>
      )}
    </div>
  )
}
