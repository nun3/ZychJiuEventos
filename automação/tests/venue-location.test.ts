import test from 'node:test'
import assert from 'node:assert/strict'
import {
  formatCepMask,
  formatVenueLocal,
  isCompleteCep,
  sanitizeCep,
  venueHasMappableAddress,
} from '../../lib/location/cep'
import { lookupCep, geocodeAddress, buildGeocodeCandidateQueries } from '../../lib/location/lookup'

test('CEP: sanitiza e mascara', () => {
  assert.equal(sanitizeCep('85.501-000'), '85501000')
  assert.equal(formatCepMask('85501000'), '85501-000')
  assert.equal(isCompleteCep('85501-000'), true)
  assert.equal(isCompleteCep('85501'), false)
})

test('formata local humano compatível', () => {
  const local = formatVenueLocal({
    nome: 'Ginásio Municipal',
    logradouro: 'Rua X',
    numero: '123',
    complemento: '',
    bairro: 'Centro',
    cidade: 'Pato Branco',
    uf: 'PR',
    cep: '85501000',
  })
  assert.equal(
    local,
    'Ginásio Municipal · Rua X, 123 · Centro · Pato Branco/PR · CEP 85501-000',
  )
})

test('venueHasMappableAddress', () => {
  assert.equal(venueHasMappableAddress({
    logradouro: 'Rua X', cidade: 'Pato Branco', uf: 'PR', latitude: null, longitude: null,
  }), true)
  assert.equal(venueHasMappableAddress({
    logradouro: '', cidade: '', uf: '', latitude: -26.2, longitude: -52.6,
  }), true)
  assert.equal(venueHasMappableAddress({
    logradouro: '', cidade: '', uf: '', latitude: null, longitude: null,
  }), false)
})

test('lookupCep válido', async () => {
  const fetchImpl = async () => ({
    ok: true,
    json: async () => ({
      cep: '85501-000',
      logradouro: 'Rua Tocantins',
      bairro: 'Centro',
      localidade: 'Pato Branco',
      uf: 'PR',
    }),
  }) as Response
  const result = await lookupCep('85501-000', fetchImpl as typeof fetch)
  assert.equal(result.ok, true)
  if (result.ok) {
    assert.equal(result.address.cidade, 'Pato Branco')
    assert.equal(result.address.uf, 'PR')
  }
})

test('lookupCep inválido / não encontrado / indisponível', async () => {
  assert.equal((await lookupCep('123', async () => ({ ok: true, json: async () => ({}) }) as Response)).ok, false)

  const notFound = await lookupCep('00000000', async () => ({
    ok: true,
    json: async () => ({ erro: true }),
  }) as Response)
  assert.equal(notFound.ok, false)
  if (!notFound.ok) assert.equal(notFound.reason, 'not_found')

  const unavailable = await lookupCep('85501000', async () => {
    throw new Error('network')
  })
  assert.equal(unavailable.ok, false)
  if (!unavailable.ok) assert.equal(unavailable.reason, 'unavailable')
})

test('geocodeAddress mock', async () => {
  const ok = await geocodeAddress(
    { logradouro: 'Rua X', numero: '10', cidade: 'Pato Branco', uf: 'PR' },
    async () => ({
      ok: true,
      json: async () => [{ lat: '-26.22', lon: '-52.67' }],
    }) as Response,
  )
  assert.equal(ok.ok, true)
  if (ok.ok) {
    assert.equal(ok.latitude, -26.22)
    assert.equal(ok.longitude, -52.67)
  }

  const fail = await geocodeAddress(
    { logradouro: 'Rua X', cidade: 'Pato Branco', uf: 'PR' },
    async () => ({ ok: false, json: async () => ([]) }) as Response,
  )
  assert.equal(fail.ok, false)

  // Progressive fallback when strict street+number returns empty array
  const calls: string[] = []
  const fallbackOk = await geocodeAddress(
    {
      logradouro: 'Rua Osvaldo Otaviano Pastro',
      numero: '10',
      bairro: 'Industrial',
      cidade: 'Pato Branco',
      uf: 'PR',
      cep: '85506522',
    },
    async (inputUrl) => {
      const q = new URL(String(inputUrl)).searchParams.get('q') || ''
      calls.push(q)
      if (q.startsWith('Industrial,')) {
        return {
          ok: true,
          json: async () => [{ lat: '-26.2375629', lon: '-52.6677115' }],
        } as Response
      }
      return { ok: true, json: async () => [] } as Response
    },
  )
  assert.equal(fallbackOk.ok, true)
  if (fallbackOk.ok) {
    assert.equal(fallbackOk.latitude, -26.2375629)
    assert.equal(fallbackOk.longitude, -52.6677115)
    assert.equal(fallbackOk.precision, 'approximate')
  }
  assert.equal(calls.length, 3)
  assert.ok(buildGeocodeCandidateQueries({
    logradouro: 'Rua Osvaldo Otaviano Pastro',
    numero: '10',
    bairro: 'Industrial',
    cidade: 'Pato Branco',
    uf: 'PR',
    cep: '85506522',
  }).includes('85506-522, Pato Branco, PR, Brasil'))
})

test('endereço manual sem CEP ainda formata local', () => {
  const local = formatVenueLocal({
    nome: 'Arena',
    logradouro: 'Av. Brasil',
    numero: '50',
    complemento: 'Bloco B',
    bairro: '',
    cidade: 'Curitiba',
    uf: 'PR',
    cep: '',
  })
  assert.equal(local, 'Arena · Av. Brasil, 50 · Bloco B · Curitiba/PR')
})
