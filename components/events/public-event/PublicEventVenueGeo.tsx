import { PublicEventVenueMap, type PublicVenueMapProps } from './PublicEventVenueMap'
import { geocodeAddress } from '@/lib/location/lookup'

/**
 * Resolve as coordenadas do local (gravadas ou geocodificadas) e desenha o mapa. Componente de servidor assíncrono:
 * usado dentro de <Suspense>, para a consulta externa não atrasar o restante da página do evento.
 */
export async function PublicEventVenueGeo({ venue }: { venue: Omit<PublicVenueMapProps, 'precision'> }) {
  let { latitude, longitude } = venue
  let precision: PublicVenueMapProps['precision'] = latitude != null && longitude != null ? 'exact' : null

  if ((latitude == null || longitude == null) && venue.cidade?.trim() && venue.uf?.trim()) {
    const geocoded = await geocodeAddress({
      logradouro: venue.logradouro || '',
      numero: venue.numero || undefined,
      bairro: venue.bairro || undefined,
      cidade: venue.cidade,
      uf: venue.uf,
      cep: venue.cep || undefined,
    })
    if (geocoded.ok) {
      latitude = geocoded.latitude
      longitude = geocoded.longitude
      precision = geocoded.precision
    }
  }

  return <PublicEventVenueMap {...venue} latitude={latitude} longitude={longitude} precision={precision} />
}
