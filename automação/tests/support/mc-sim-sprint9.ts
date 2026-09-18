export const MC_SIM_SPRINT9_PREFIX = 'MC-SIM Sprint 9';

export type McSimSprint9Identity = {
  revision: 'sprint9';
  runId: string;
  eventId: string;
  eventName: string;
  organizationId: string;
  ruleSetId: string;
  teamIds: string[];
  categoryIds: {
    semi4: string;
    final2: string;
  };
  athleteIds: string[];
  registrationIds: string[];
};

export type McSimSprint9Report = {
  identity: Pick<McSimSprint9Identity, 'revision' | 'runId' | 'eventName'>;
  ok: boolean;
  scenarios: string[];
  failuresFoundAndFixed: string[];
  cleanup: 'completed';
};
