import assert from 'node:assert/strict'
import { test } from 'node:test'
import { featuredActions, rowActions } from '../../lib/events/catalog-presentation'
import { getCinematicPreviewEvents, getDevelopmentPreviewEvent } from '../../lib/home/cinematic-preview-events'

const preview = getCinematicPreviewEvents()[0]

test('detalhes do ensaio abre a página do campeonato fictício', () => {
  const [rehearsal, details] = rowActions(preview)
  assert.equal(rehearsal.label, 'Inscrever-se')
  assert.equal(rehearsal.href, '#experimentar-demo')
  assert.equal(details.label, 'Detalhes')
  assert.equal(details.href, `/eventos/${preview.id}`)
})

test('o destaque do ensaio leva ao mesmo campeonato', () => {
  const [rehearsal, open] = featuredActions(preview)
  assert.equal(rehearsal.href, '#experimentar-demo')
  assert.equal(open.label, 'Ver campeonato')
  assert.equal(open.href, `/eventos/${preview.id}`)
})

test('evento publicado de verdade não usa a página fictícia', () => {
  const real = { ...preview, id: '11111111-1111-1111-1111-111111111111', status: 'publicado' }
  const [primary, secondary] = rowActions(real)
  assert.equal(primary.label, 'Ver campeonato')
  assert.equal(primary.href, `/eventos/${real.id}`)
  assert.equal(secondary.label, 'Experimentar sem cadastro')
  assert.equal(secondary.href, '#experimentar-demo')

  const open = { ...real, status: 'inscricao' }
  const [join, details] = rowActions(open)
  assert.equal(join.href, `/eventos/${open.id}/inscricao/cadastrar-atleta`)
  assert.equal(details.label, 'Detalhes')
  assert.equal(details.href, `/eventos/${open.id}`)
})

test('página fictícia só existe em development', () => {
  assert.equal(getDevelopmentPreviewEvent(preview.id, 'production'), null)
  assert.equal(getDevelopmentPreviewEvent(preview.id, 'test'), null)
  assert.equal(getDevelopmentPreviewEvent('evento-real', 'development'), null)
  assert.equal(getDevelopmentPreviewEvent(preview.id, 'development')?.title, preview.title)
})
