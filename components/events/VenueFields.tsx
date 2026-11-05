'use client'

import { useEffect, useRef, useState } from 'react'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import {
  formatCepMask,
  formatVenueLocal,
  openStreetMapEmbedUrl,
  openStreetMapExternalUrl,
  sanitizeCep,
  venueHasMappableAddress,
  type CepLookupStatus,
  type VenueFields as VenueState,
} from '@/lib/location/cep'

const emptyVenue: VenueState = {
  nome: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
  latitude: null,
  longitude: null,
}

const statusMessage: Record<CepLookupStatus, string> = {
  idle: '',
  loading: 'Buscando CEP...',
  found: 'CEP encontrado',
  not_found: 'CEP não encontrado',
  unavailable: 'Não foi possível consultar agora; preencha manualmente.',
}

type Props = {
  error?: string
  initial?: Partial<VenueState>
}

function initialVenue(initial?: Partial<VenueState>): VenueState {
  const base = { ...emptyVenue, ...initial }
  if (base.cep) base.cep = formatCepMask(base.cep)
  if (base.uf) base.uf = base.uf.toUpperCase()
  return base
}

function hasHydratedAddress(fields: VenueState) {
  return Boolean(fields.logradouro.trim() && fields.cidade.trim() && fields.uf.trim())
}

export function VenueFields({ error, initial }: Props) {
  const [venue, setVenue] = useState<VenueState>(() => initialVenue(initial))
  const [cepStatus, setCepStatus] = useState<CepLookupStatus>(() => {
    const hydrated = initialVenue(initial)
    return hasHydratedAddress(hydrated) && sanitizeCep(hydrated.cep).length === 8 ? 'found' : 'idle'
  })
  const [mapPrecision, setMapPrecision] = useState<'exact' | 'approximate' | null>(() => {
    return typeof initial?.latitude === 'number' && typeof initial?.longitude === 'number' ? 'exact' : null
  })
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const geocodeRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastLookedUp = useRef(
    (() => {
      const hydrated = initialVenue(initial)
      return hasHydratedAddress(hydrated) ? sanitizeCep(hydrated.cep) : ''
    })(),
  )

  const formattedLocal = formatVenueLocal(venue)

  function patch(partial: Partial<VenueState>) {
    setVenue((current) => ({ ...current, ...partial }))
  }

  async function lookup(cepDigits: string) {
    if (cepDigits.length !== 8) return
    if (lastLookedUp.current === cepDigits && cepStatus === 'found') return
    setCepStatus('loading')
    try {
      const response = await fetch(`/api/location/cep?cep=${cepDigits}`)
      const payload = await response.json()
      if (!payload.ok) {
        setCepStatus(payload.reason === 'not_found' ? 'not_found' : 'unavailable')
        return
      }
      lastLookedUp.current = cepDigits
      setCepStatus('found')
      patch({
        cep: payload.address.cep,
        logradouro: payload.address.logradouro || venue.logradouro,
        bairro: payload.address.bairro || venue.bairro,
        cidade: payload.address.cidade,
        uf: payload.address.uf,
      })
    } catch {
      setCepStatus('unavailable')
    }
  }

  useEffect(() => {
    const digits = sanitizeCep(venue.cep)
    if (digits.length !== 8) {
      if (cepStatus === 'loading') setCepStatus('idle')
      return
    }
    // Endereço já hidratado (ex.: edição): não reconsulta só por montar o campo.
    if (lastLookedUp.current === digits && hasHydratedAddress(venue)) {
      if (cepStatus !== 'found') setCepStatus('found')
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void lookup(digits)
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venue.cep])

  useEffect(() => {
    if (!venueHasMappableAddress(venue)) {
      if (venue.latitude != null || venue.longitude != null) {
        patch({ latitude: null, longitude: null })
      }
      if (mapPrecision !== null) setMapPrecision(null)
      return
    }
    if (typeof venue.latitude === 'number' && typeof venue.longitude === 'number') return
    if (geocodeRef.current) clearTimeout(geocodeRef.current)
    geocodeRef.current = setTimeout(async () => {
      const params = new URLSearchParams({
        logradouro: venue.logradouro,
        numero: venue.numero,
        bairro: venue.bairro,
        cidade: venue.cidade,
        uf: venue.uf,
        cep: sanitizeCep(venue.cep),
      })
      try {
        const response = await fetch(`/api/location/geocode?${params.toString()}`)
        const payload = await response.json()
        if (payload.ok) {
          patch({ latitude: payload.latitude, longitude: payload.longitude })
          setMapPrecision(payload.precision === 'approximate' ? 'approximate' : 'exact')
        }
      } catch {
        // mapa é best-effort
      }
    }, 600)
    return () => {
      if (geocodeRef.current) clearTimeout(geocodeRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venue.logradouro, venue.numero, venue.bairro, venue.cidade, venue.uf, venue.cep])

  const showMap = typeof venue.latitude === 'number' && typeof venue.longitude === 'number'

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-mc-interface text-sm font-semibold uppercase tracking-wide text-mc-text-secondary">Local do campeonato</h3>
        <p className="mt-1 font-mc-interface text-sm text-mc-text-secondary">Informe o CEP para preencher o endereço. Você pode editar qualquer campo.</p>
      </div>

      <input type="hidden" name="local" value={formattedLocal} />
      <input type="hidden" name="local_latitude" value={venue.latitude ?? ''} />
      <input type="hidden" name="local_longitude" value={venue.longitude ?? ''} />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="local_nome" label="Nome do local" required error={error} className="sm:col-span-2" description="Ex. Ginásio Municipal">
          <Input
            name="local_nome"
            value={venue.nome}
            autoComplete="organization"
            aria-invalid={Boolean(error)}
            onChange={(event) => patch({ nome: event.target.value })}
          />
        </FormField>

        <FormField
          id="local_cep"
          label="CEP"
          description={statusMessage[cepStatus] || 'Máscara 00000-000'}
        >
          <Input
            name="local_cep"
            inputMode="numeric"
            autoComplete="postal-code"
            value={venue.cep}
            aria-busy={cepStatus === 'loading'}
            aria-live="polite"
            onChange={(event) => {
              lastLookedUp.current = ''
              patch({ cep: formatCepMask(event.target.value), latitude: null, longitude: null })
            }}
            onBlur={() => {
              const digits = sanitizeCep(venue.cep)
              if (digits.length === 8) void lookup(digits)
            }}
          />
        </FormField>

        <FormField id="local_numero" label="Número" required>
          <Input
            name="local_numero"
            value={venue.numero}
            autoComplete="address-line2"
            onChange={(event) => patch({ numero: event.target.value, latitude: null, longitude: null })}
          />
        </FormField>

        <FormField id="local_logradouro" label="Endereço" className="sm:col-span-2">
          <Input
            name="local_logradouro"
            value={venue.logradouro}
            autoComplete="address-line1"
            onChange={(event) => patch({ logradouro: event.target.value, latitude: null, longitude: null })}
          />
        </FormField>

        <FormField id="local_bairro" label="Bairro">
          <Input
            name="local_bairro"
            value={venue.bairro}
            onChange={(event) => patch({ bairro: event.target.value, latitude: null, longitude: null })}
          />
        </FormField>

        <FormField id="local_complemento" label="Complemento">
          <Input
            name="local_complemento"
            value={venue.complemento}
            onChange={(event) => patch({ complemento: event.target.value })}
          />
        </FormField>

        <FormField id="local_cidade" label="Cidade">
          <Input
            name="local_cidade"
            value={venue.cidade}
            autoComplete="address-level2"
            onChange={(event) => patch({ cidade: event.target.value, latitude: null, longitude: null })}
          />
        </FormField>

        <FormField id="local_uf" label="UF">
          <Input
            name="local_uf"
            value={venue.uf}
            maxLength={2}
            autoComplete="address-level1"
            onChange={(event) => patch({ uf: event.target.value.toUpperCase(), latitude: null, longitude: null })}
          />
        </FormField>
      </div>

      {showMap ? (
        <div className="space-y-2">
          <p className="font-mc-interface text-sm text-mc-text-secondary">{formattedLocal}</p>
          {mapPrecision === 'approximate' ? (
            <p className="font-mc-interface text-xs text-mc-text-secondary">
              Mapa posicionado na região aproximada (bairro/cidade); o endereço completo informado acima é preservado no evento.
            </p>
          ) : null}
          <div className="overflow-hidden rounded-mc-medium border border-mc-border bg-mc-surface-secondary">
            <iframe
              title="Mapa do local do campeonato"
              src={openStreetMapEmbedUrl(venue.latitude!, venue.longitude!)}
              className="h-56 w-full border-0 sm:h-72"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              tabIndex={-1}
            />
          </div>
          <a
            href={openStreetMapExternalUrl(venue.latitude!, venue.longitude!)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center font-mc-interface text-sm font-semibold text-mc-action hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"
          >
            Abrir em mapa
          </a>
        </div>
      ) : (
        <p className="font-mc-interface text-sm text-mc-text-secondary">
          O mapa aparece quando cidade, UF e endereço estiverem preenchidos.
        </p>
      )}
    </div>
  )
}
