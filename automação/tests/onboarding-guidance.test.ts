import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildAthleteChecklist,
  buildOrganizerChecklist,
  buildProfessorChecklist,
  resolveOnboardingProfile,
} from '../../lib/onboarding/checklists';
import {
  adminEventContinuePath,
  buildEventGuidanceSteps,
  buildNextAction,
  guidanceStepsForPhase,
  contextualizeNextAction,
  currentGuidanceStep,
  type EventGuidanceFacts,
} from '../../lib/onboarding/event-guidance';
import { buildOnboardingRunId } from '../../lib/onboarding/run-id';
import { COACHMARKS } from '../../lib/onboarding/coachmarks';
import {
  emptyOnboardingPreferences,
  isCoachmarkDismissed,
  onboardingStorageKey,
  parseOnboardingPreferences,
} from '../../lib/onboarding/storage';

function facts(overrides: Partial<EventGuidanceFacts> = {}): EventGuidanceFacts {
  return {
    eventId: 'evt-1',
    status: 'checagem',
    checkingLocked: false,
    hasCategory: true,
    efetivadasCount: 24,
    pendingRequestsCount: 3,
    hasPublishedBracket: false,
    schedulePublished: false,
    ...overrides,
  };
}

test('timeline da checagem marca etapas anteriores e deixa chaves adiante', () => {
  const steps = buildEventGuidanceSteps(facts());
  assert.equal(currentGuidanceStep(facts()), 'checagem');
  assert.deepEqual(steps.map((step) => step.state), [
    'done', 'done', 'done', 'current', 'upcoming', 'upcoming', 'upcoming', 'upcoming',
  ]);
  assert.equal(steps.find((step) => step.state === 'current')?.id, 'checagem');
});

test('pagamento é a fase atual quando o status real é pagamento', () => {
  const current = facts({ status: 'pagamento' });
  assert.equal(currentGuidanceStep(current), 'pagamento');
  const steps = buildEventGuidanceSteps(current);
  assert.equal(steps.find((step) => step.id === 'inscricoes')?.state, 'done');
  assert.equal(steps.find((step) => step.id === 'pagamento')?.state, 'current');
  assert.equal(steps.find((step) => step.id === 'checagem')?.state, 'upcoming');
});

test('chaves publicadas sem programação avançam a etapa visual para programação', () => {
  const current = currentGuidanceStep(facts({
    status: 'chaves',
    hasPublishedBracket: true,
    schedulePublished: false,
  }));
  assert.equal(current, 'programacao');
});

test('CTA da checagem com pedidos pendentes pede revisão, sem inventar fase', () => {
  const action = buildNextAction(facts());
  assert.equal(action.title, 'Checagem aberta');
  assert.match(action.facts.join(' '), /24 atletas efetivados/);
  assert.match(action.facts.join(' '), /3 solicitações pendentes/);
  assert.equal(action.cta, 'Revisar solicitações');
  assert.equal(action.href, '/admin/eventos/evt-1/checagem');
});

test('abrir inscrições executa a transição no evento e não volta para a lista', () => {
  const action = buildNextAction(facts({ status: 'publicado', hasCategory: true, pendingRequestsCount: 0 }));
  assert.equal(action.cta, 'Abrir inscrições');
  assert.equal(action.transition, 'inscricao');
  assert.equal(action.href, null);
});

test('inscrições abertas não oferecem ver eventos', () => {
  const action = buildNextAction(facts({ status: 'inscricao', pendingRequestsCount: 0 }));
  assert.equal(action.title, 'Inscrições abertas');
  assert.equal(action.cta, 'Abrir pagamento');
  assert.notEqual(action.cta, 'Ver eventos');
  assert.equal(action.href, null);
});

test('cta do módulo ativo some e a transição de fase permanece', () => {
  const review = buildNextAction(facts());
  const onChecking = contextualizeNextAction(review, 'checagem');
  assert.equal(onChecking.cta, null);
  assert.equal(onChecking.href, null);
  assert.equal(onChecking.title, 'Checagem aberta');

  const payment = buildNextAction(facts({ status: 'pagamento', pendingRequestsCount: 0 }));
  const onFinance = contextualizeNextAction(payment, 'financeiro');
  assert.equal(onFinance.cta, 'Abrir checagem');
  assert.equal(onFinance.transition, 'checagem');
});

test('continuar da lista aponta para o módulo da fase', () => {
  assert.equal(adminEventContinuePath('evt-1', 'publicado'), '/admin/eventos/evt-1/configuracao');
  assert.equal(adminEventContinuePath('evt-1', 'pagamento'), '/admin/eventos/evt-1/financeiro');
  assert.equal(adminEventContinuePath('evt-1', 'checagem'), '/admin/eventos/evt-1/checagem');
  assert.equal(adminEventContinuePath('evt-1', 'chaves'), '/admin/eventos/evt-1/chaves');
  assert.equal(adminEventContinuePath('evt-1', 'em_andamento'), '/admin/eventos/evt-1/resultados');
});

test('evento cancelado não oferece CTA operacional', () => {
  const action = buildNextAction(facts({ status: 'cancelado' }));
  assert.equal(action.href, null);
  assert.equal(action.cta, null);
});

test('progresso do card usa a mesma fase da administração', () => {
  const payment = guidanceStepsForPhase('pagamento');
  assert.equal(payment.find((step) => step.id === 'inscricoes')?.state, 'done');
  assert.equal(payment.find((step) => step.id === 'pagamento')?.state, 'current');
  assert.equal(payment.find((step) => step.id === 'checagem')?.state, 'upcoming');

  const afterBracket = guidanceStepsForPhase('chaves', { hasPublishedBracket: true });
  assert.equal(afterBracket.find((step) => step.id === 'chaves')?.state, 'done');
  assert.equal(afterBracket.find((step) => step.id === 'programacao')?.state, 'current');
});

test('checklist do organizador só marca etapas já alcançadas no status real', () => {
  const checklist = buildOrganizerChecklist({
    hasEvent: true,
    hasCategory: true,
    hasOpenedRegistrations: true,
    hasReachedChecking: false,
    hasReachedBrackets: false,
    hasReachedSchedule: false,
    hasReachedResults: false,
  });
  assert.equal(checklist.title, 'Configure seu primeiro campeonato');
  assert.equal(checklist.items.find((item) => item.id === 'inscricoes')?.done, true);
  assert.equal(checklist.items.find((item) => item.id === 'checagem')?.done, false);
});

test('professor e atleta recebem fluxos reduzidos existentes', () => {
  assert.equal(resolveOnboardingProfile({
    canManageEvents: false,
    isProfessor: true,
    tipoCadastro: 'professor',
    hasSelfAthlete: false,
  }), 'professor');
  const professor = buildProfessorChecklist({
    hasTeam: true,
    hasAthlete: false,
    hasRegistration: false,
    hasCheckingFollowUp: false,
  });
  assert.equal(professor.items[0].done, true);
  assert.equal(professor.items[1].done, false);
  const athlete = buildAthleteChecklist({
    hasSportsProfile: true,
    hasTeam: true,
    hasPublishedEvent: true,
    hasRegistration: false,
  });
  assert.equal(athlete.title, 'Prepare-se para competir');
  assert.equal(athlete.items.find((item) => item.id === 'inscricao')?.done, false);
});

test('coachmark de chaves não repete a próxima ação', () => {
  const action = buildNextAction(facts({
    status: 'chaves',
    checkingLocked: true,
    hasPublishedBracket: false,
    schedulePublished: false,
  }));
  assert.notEqual(action.message, COACHMARKS.chaves);
  assert.match(action.message, /sugestão|casamento|publicar/i);
  assert.match(COACHMARKS.chaves, /rascunho/i);
});

test('RUN_ID visual usa prefixo descartável e relógio de São Paulo', () => {
  assert.equal(buildOnboardingRunId(new Date('2026-09-25T22:50:00-03:00')), 'MC-ONBOARDING-20260925-225000');
});

test('preferência local permite ignorar coachmark sem bloquear navegação', () => {
  assert.equal(onboardingStorageKey('user-1'), 'mc-onboarding:user-1');
  const dismissed = parseOnboardingPreferences(JSON.stringify({
    checklistHidden: true,
    coachmarks: { checagem: true },
  }));
  assert.equal(dismissed.checklistHidden, true);
  assert.equal(isCoachmarkDismissed(dismissed, 'checagem'), true);
  assert.equal(isCoachmarkDismissed(emptyOnboardingPreferences(), 'checagem'), false);
});
