import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  getPublicEventPresentation,
  resolvePhaseTimelineStatus,
  resolvePublicOverviewText,
} from '../../lib/events/public-event-presentation'

const samplePhases = [
  {
    id: 'p-inscricao',
    tipo: 'inscricao' as const,
    inicio: '2026-01-01T00:00:00Z',
    fim: '2030-12-31T00:00:00Z',
  },
  {
    id: 'p-pagamento',
    tipo: 'pagamento' as const,
    inicio: '2026-02-01T00:00:00Z',
    fim: '2030-12-31T00:00:00Z',
  },
  {
    id: 'p-checagem',
    tipo: 'checagem' as const,
    inicio: '2026-03-01T00:00:00Z',
    fim: '2030-12-31T00:00:00Z',
  },
  {
    id: 'p-chaves',
    tipo: 'chaves' as const,
    inicio: '2026-04-01T00:00:00Z',
    fim: '2030-12-31T00:00:00Z',
  },
]

test('inscrição ativa: hero, registration e primaryAction coerentes', () => {
  const presentation = getPublicEventPresentation({
    status: 'inscricao',
    phases: samplePhases,
    informacoes: 'Campeonato estadual com regras oficiais publicadas.',
  })

  assert.equal(presentation.eventStatus.label, 'Inscrições abertas')
  assert.equal(presentation.registrationStatus.label, 'Inscrições abertas')
  assert.equal(presentation.currentPhase, 'inscricao')
  assert.equal(presentation.primaryAction, 'inscricao')
  assert.equal(presentation.showRegistrationCta, true)
  assert.equal(presentation.phases.find((p) => p.tipo === 'inscricao')?.timeline.state, 'atual')
  assert.equal(presentation.phases.find((p) => p.tipo === 'pagamento')?.timeline.state, 'futura')
})

test('pagamento ativo: inscrição não fica em andamento e registration encerra', () => {
  const presentation = getPublicEventPresentation({
    status: 'pagamento',
    phases: samplePhases,
  })

  assert.equal(presentation.eventStatus.label, 'Fase de pagamento')
  assert.equal(presentation.currentPhase, 'pagamento')
  assert.equal(presentation.registrationStatus.label, 'Inscrições encerradas')
  assert.equal(presentation.showRegistrationCta, false)
  assert.equal(presentation.primaryAction, 'chaves')

  const inscricao = presentation.phases.find((p) => p.tipo === 'inscricao')
  const pagamento = presentation.phases.find((p) => p.tipo === 'pagamento')
  assert.equal(inscricao?.timeline.state, 'concluida')
  assert.equal(inscricao?.timeline.label, 'Concluída')
  assert.equal(pagamento?.timeline.state, 'atual')
  assert.equal(pagamento?.timeline.label, 'Em andamento')
})

test('checagem ativa: primaryAction não volta para inscrição', () => {
  const presentation = getPublicEventPresentation({
    status: 'checagem',
    phases: samplePhases,
  })

  assert.equal(presentation.eventStatus.label, 'Checagem liberada')
  assert.equal(presentation.currentPhase, 'checagem')
  assert.equal(presentation.primaryAction, 'checagem')
  assert.equal(presentation.showRegistrationCta, false)
  assert.equal(presentation.showCheckingLink, true)
  assert.equal(presentation.phases.find((p) => p.tipo === 'inscricao')?.timeline.state, 'concluida')
  assert.equal(presentation.phases.find((p) => p.tipo === 'checagem')?.timeline.state, 'atual')
})

test('chaves publicadas: prioriza ação operacional', () => {
  const presentation = getPublicEventPresentation({
    status: 'chaves',
    phases: samplePhases,
  })

  assert.equal(presentation.eventStatus.label, 'Chaves publicadas')
  assert.equal(presentation.currentPhase, 'chaves')
  assert.equal(presentation.primaryAction, 'chaves')
  assert.equal(presentation.prioritizeOperationalLinks, true)
  assert.equal(presentation.showRegistrationCta, false)
  assert.equal(presentation.phases.find((p) => p.tipo === 'pagamento')?.timeline.state, 'concluida')
  assert.equal(presentation.phases.find((p) => p.tipo === 'chaves')?.timeline.state, 'atual')
})

test('timeline ignora janela de calendário aberta quando status já avançou', () => {
  const timeline = resolvePhaseTimelineStatus('inscricao', 'pagamento')
  assert.equal(timeline.state, 'concluida')
  assert.notEqual(timeline.label, 'Em andamento')
})

test('visão geral preserva texto público com Sandbox e rejeita curadoria da Home', () => {
  const withSandbox =
    'Evento de validação pública do Sandbox MEU CAMP. Este campeonato testa a exibição correta da Visão geral no hub público.'
  assert.equal(resolvePublicOverviewText(withSandbox), withSandbox)
  assert.equal(
    resolvePublicOverviewText('Campeonato Sandbox MEU CAMP para atletas e professores.'),
    'Campeonato Sandbox MEU CAMP para atletas e professores.',
  )
  assert.equal(
    resolvePublicOverviewText('Campeonato publicado com banner oficial para o carrossel editorial da Home.'),
    null,
  )
  assert.equal(
    resolvePublicOverviewText('Campeonato estadual com regras oficiais publicadas.'),
    'Campeonato estadual com regras oficiais publicadas.',
  )
  assert.equal(resolvePublicOverviewText('   '), null)
})

test('hero, timeline e aside não se contradizem no pagamento', () => {
  const presentation = getPublicEventPresentation({ status: 'pagamento', phases: samplePhases })
  const inscricao = presentation.phases.find((p) => p.tipo === 'inscricao')!

  assert.match(presentation.eventStatus.label, /pagamento/i)
  assert.match(presentation.registrationStatus.label, /encerrada/i)
  assert.equal(inscricao.timeline.state, 'concluida')
  assert.equal(presentation.showRegistrationCta, false)
})
