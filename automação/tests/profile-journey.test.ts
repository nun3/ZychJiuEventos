import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  allowsJourneyOrganization,
  buildProfileJourney,
  deriveGroupPlacements,
  derivePlacementsForAthletes,
  isCountableParticipation,
  type JourneyAwardCandidate,
  type JourneyOrganizedEventFact,
  type JourneyRegistrationFact,
} from '../../lib/profile/profile-journey';

const orgA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const orgB = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const athleteA = '11111111-1111-1111-1111-111111111111';
const athleteB = '22222222-2222-2222-2222-222222222222';
const entryA = '33333333-3333-3333-3333-333333333333';
const entryB = '44444444-4444-4444-4444-444444444444';
const entryC = '55555555-5555-5555-5555-555555555555';
const event1 = '66666666-6666-6666-6666-666666666666';
const event2 = '77777777-7777-7777-7777-777777777777';

function reg(partial: Partial<JourneyRegistrationFact> & Pick<JourneyRegistrationFact, 'registrationId' | 'eventId' | 'eventDate'>): JourneyRegistrationFact {
  return {
    athleteId: athleteA,
    eventName: 'Copa Teste',
    eventLocal: 'Pato Branco',
    eventStatus: 'publicado',
    organizationId: orgA,
    registrationStatus: 'efetivada',
    teamName: 'Equipe Alpha',
    ...partial,
  };
}

test('usuário sem histórico recebe estado vazio convidativo', () => {
  const journey = buildProfileJourney({
    scope: { mode: 'unrestricted' },
    now: new Date('2026-09-30T12:00:00Z'),
    selfAthleteId: athleteA,
    managedAthleteIds: [],
    selfRegistrations: [],
    managedRegistrations: [],
    awardCandidates: [],
    organizedEvents: [],
    showSports: true,
    showOperations: false,
  });
  assert.equal(journey.empty, true);
  assert.match(journey.emptyMessage, /primeiro campeonato/i);
  assert.equal(journey.sports?.championships, 0);
});

test('inscrição cancelada não conta como participação', () => {
  assert.equal(
    isCountableParticipation(
      reg({ registrationId: 'r1', eventId: event1, eventDate: '2026-08-01', registrationStatus: 'cancelada' }),
      { mode: 'unrestricted' },
    ),
    false,
  );
  assert.equal(
    isCountableParticipation(
      reg({ registrationId: 'r2', eventId: event1, eventDate: '2026-08-01', registrationStatus: 'efetivada' }),
      { mode: 'unrestricted' },
    ),
    true,
  );
});

test('atleta com uma participação conta um campeonato', () => {
  const journey = buildProfileJourney({
    scope: { mode: 'unrestricted' },
    now: new Date('2026-09-30T12:00:00Z'),
    selfAthleteId: athleteA,
    managedAthleteIds: [],
    selfRegistrations: [reg({ registrationId: 'r1', eventId: event1, eventDate: '2026-08-01', eventName: 'Open' })],
    managedRegistrations: [],
    awardCandidates: [],
    organizedEvents: [],
    showSports: true,
    showOperations: false,
  });
  assert.equal(journey.empty, false);
  assert.equal(journey.sports?.championships, 1);
  assert.equal(journey.sports?.recent.length, 1);
});

test('múltiplos eventos e próxima participação futura', () => {
  const journey = buildProfileJourney({
    scope: { mode: 'unrestricted' },
    now: new Date('2026-09-30T12:00:00Z'),
    selfAthleteId: athleteA,
    managedAthleteIds: [],
    selfRegistrations: [
      reg({ registrationId: 'r1', eventId: event1, eventDate: '2026-08-01', eventName: 'Open' }),
      reg({ registrationId: 'r2', eventId: event2, eventDate: '2026-10-18', eventName: 'Copa Sudoeste' }),
      reg({ registrationId: 'r3', eventId: event2, eventDate: '2026-10-18', eventName: 'Copa Sudoeste' }),
    ],
    managedRegistrations: [],
    awardCandidates: [],
    organizedEvents: [],
    showSports: true,
    showOperations: false,
  });
  assert.equal(journey.sports?.championships, 2);
  assert.equal(journey.sports?.upcoming.length, 1);
  assert.equal(journey.sports?.upcoming[0]?.name, 'Copa Sudoeste');
});

test('final_2 gera ouro e prata', () => {
  const placements = deriveGroupPlacements('final_2', [
    {
      round: 'final',
      pairIndex: 1,
      status: 'concluido',
      sideAEntryId: entryA,
      sideBEntryId: entryB,
      winnerEntryId: entryA,
    },
  ]);
  assert.deepEqual(placements, [
    { place: 1, entryId: entryA },
    { place: 2, entryId: entryB },
  ]);
});

test('semi_4 gera dois terceiros', () => {
  const placements = deriveGroupPlacements('semi_4', [
    {
      round: 'final',
      pairIndex: 1,
      status: 'concluido',
      sideAEntryId: entryA,
      sideBEntryId: entryB,
      winnerEntryId: entryA,
    },
    {
      round: 'semifinal',
      pairIndex: 1,
      status: 'concluido',
      sideAEntryId: entryA,
      sideBEntryId: entryC,
      winnerEntryId: entryA,
    },
    {
      round: 'semifinal',
      pairIndex: 2,
      status: 'concluido',
      sideAEntryId: entryB,
      sideBEntryId: '88888888-8888-8888-8888-888888888888',
      winnerEntryId: entryB,
    },
  ]);
  assert.equal(placements.filter((item) => item.place === 3).length, 2);
});

test('resultado oficial gera colocação e medalha sem duplicar evento', () => {
  const candidate: JourneyAwardCandidate = {
    athleteId: athleteA,
    entryId: entryA,
    eventId: event1,
    eventName: 'Open',
    eventDate: '2026-08-01',
    organizationId: orgA,
    topology: 'final_2',
    awardsConfirmedAt: '2026-08-01T20:00:00Z',
    matches: [
      {
        round: 'final',
        pairIndex: 1,
        status: 'concluido',
        sideAEntryId: entryA,
        sideBEntryId: entryB,
        winnerEntryId: entryA,
      },
    ],
  };
  const placements = derivePlacementsForAthletes([candidate, candidate], new Set([athleteA]), { mode: 'unrestricted' });
  assert.equal(placements.length, 1);
  assert.equal(placements[0]?.place, 1);
  assert.equal(placements[0]?.medal, 'ouro');

  const journey = buildProfileJourney({
    scope: { mode: 'unrestricted' },
    now: new Date('2026-09-30T12:00:00Z'),
    selfAthleteId: athleteA,
    managedAthleteIds: [],
    selfRegistrations: [reg({ registrationId: 'r1', eventId: event1, eventDate: '2026-08-01', eventName: 'Open' })],
    managedRegistrations: [],
    awardCandidates: [candidate],
    organizedEvents: [],
    showSports: true,
    showOperations: false,
  });
  assert.equal(journey.sports?.podiums, 1);
  assert.equal(journey.sports?.gold, 1);
  assert.equal(journey.sports?.recent[0]?.place, 1);
});

test('organizador vê apenas eventos válidos do próprio escopo', () => {
  const organized: JourneyOrganizedEventFact[] = [
    {
      eventId: event1,
      eventName: 'Evento A',
      eventDate: '2026-10-01',
      eventLocal: 'PB',
      eventStatus: 'publicado',
      organizationId: orgA,
    },
    {
      eventId: event2,
      eventName: 'Evento B',
      eventDate: '2026-07-01',
      eventLocal: 'PB',
      eventStatus: 'cancelado',
      organizationId: orgA,
    },
    {
      eventId: '99999999-9999-9999-9999-999999999999',
      eventName: 'Outra org',
      eventDate: '2026-10-02',
      eventLocal: 'X',
      eventStatus: 'publicado',
      organizationId: orgB,
    },
  ];
  const journey = buildProfileJourney({
    scope: { mode: 'restricted', organizationId: orgA },
    now: new Date('2026-09-30T12:00:00Z'),
    selfAthleteId: null,
    managedAthleteIds: [],
    selfRegistrations: [],
    managedRegistrations: [],
    awardCandidates: [],
    organizedEvents: organized,
    showSports: false,
    showOperations: true,
  });
  assert.equal(journey.operations?.eventsOrganized, 1);
  assert.equal(journey.operations?.nextOrganizedEvent?.name, 'Evento A');
});

test('professor conta somente vínculos gerenciados', () => {
  const journey = buildProfileJourney({
    scope: { mode: 'unrestricted' },
    now: new Date('2026-09-30T12:00:00Z'),
    selfAthleteId: null,
    managedAthleteIds: [athleteA],
    selfRegistrations: [],
    managedRegistrations: [
      reg({ registrationId: 'r1', athleteId: athleteA, eventId: event1, eventDate: '2026-08-01' }),
      reg({ registrationId: 'r2', athleteId: athleteB, eventId: event2, eventDate: '2026-08-02' }),
    ],
    awardCandidates: [],
    organizedEvents: [],
    showSports: false,
    showOperations: true,
  });
  assert.equal(journey.operations?.managedAthletes, 1);
  assert.equal(journey.operations?.championshipsWithAthletes, 1);
});

test('usuário com múltiplos papéis mantém blocos semânticos separados', () => {
  const journey = buildProfileJourney({
    scope: { mode: 'unrestricted' },
    now: new Date('2026-09-30T12:00:00Z'),
    selfAthleteId: athleteA,
    managedAthleteIds: [athleteB],
    selfRegistrations: [reg({ registrationId: 'r1', eventId: event1, eventDate: '2026-08-01' })],
    managedRegistrations: [reg({ registrationId: 'r2', athleteId: athleteB, eventId: event2, eventDate: '2026-08-02' })],
    awardCandidates: [],
    organizedEvents: [
      {
        eventId: event2,
        eventName: 'Org Event',
        eventDate: '2026-11-01',
        eventLocal: 'PB',
        eventStatus: 'publicado',
        organizationId: orgA,
      },
    ],
    showSports: true,
    showOperations: true,
  });
  assert.equal(journey.sports?.championships, 1);
  assert.equal(journey.operations?.eventsOrganized, 1);
  assert.equal(journey.operations?.managedAthletes, 1);
});

test('isolamento organizacional fail-closed e exclusão de outro tenant', () => {
  assert.equal(allowsJourneyOrganization(orgA, { mode: 'blocked' }), false);
  assert.equal(allowsJourneyOrganization(orgB, { mode: 'restricted', organizationId: orgA }), false);
  assert.equal(allowsJourneyOrganization(orgA, { mode: 'restricted', organizationId: orgA }), true);

  const journey = buildProfileJourney({
    scope: { mode: 'restricted', organizationId: orgA },
    now: new Date('2026-09-30T12:00:00Z'),
    selfAthleteId: athleteA,
    managedAthleteIds: [],
    selfRegistrations: [
      reg({ registrationId: 'r1', eventId: event1, eventDate: '2026-08-01', organizationId: orgA }),
      reg({ registrationId: 'r2', eventId: event2, eventDate: '2026-08-02', organizationId: orgB }),
    ],
    managedRegistrations: [],
    awardCandidates: [],
    organizedEvents: [],
    showSports: true,
    showOperations: false,
  });
  assert.equal(journey.sports?.championships, 1);
});

test('timeline ordena do mais recente e evita duplicidade', () => {
  const journey = buildProfileJourney({
    scope: { mode: 'unrestricted' },
    now: new Date('2026-09-30T12:00:00Z'),
    selfAthleteId: athleteA,
    managedAthleteIds: [],
    selfRegistrations: [
      reg({ registrationId: 'r1', eventId: event1, eventDate: '2026-08-01', eventName: 'Open' }),
      reg({ registrationId: 'r2', eventId: event2, eventDate: '2026-10-18', eventName: 'Copa' }),
    ],
    managedRegistrations: [],
    awardCandidates: [
      {
        athleteId: athleteA,
        entryId: entryA,
        eventId: event1,
        eventName: 'Open',
        eventDate: '2026-08-01',
        organizationId: orgA,
        topology: 'final_2',
        awardsConfirmedAt: '2026-08-01T20:00:00Z',
        matches: [
          {
            round: 'final',
            pairIndex: 1,
            status: 'concluido',
            sideAEntryId: entryA,
            sideBEntryId: entryB,
            winnerEntryId: entryB,
          },
        ],
      },
    ],
    organizedEvents: [],
    showSports: true,
    showOperations: false,
  });
  assert.equal(journey.sports?.timeline.length, 2);
  assert.equal(journey.sports?.timeline[0]?.title, 'Copa');
  assert.equal(journey.sports?.timeline[1]?.subtitle, '2º lugar');
});
