export const MC_SIM_SPRINT8_PREFIX = 'MC-SIM Sprint 8';

export type McSimSprint8Identity = {
  revision: 'sprint8';
  runId: string;
  eventId: string;
  eventName: string;
  organizationId: string;
  ruleSetId: string;
  teamIds: string[];
  categoryIds: {
    semConfronto: string;
    final2: string;
    copo3: string;
    semi4: string;
    agrupada9: string;
  };
  athleteIds: string[];
  registrationIds: string[];
};

export type McSimSprint8Report = {
  identity: Pick<McSimSprint8Identity, 'revision' | 'runId' | 'eventName'>;
  ok: boolean;
  scenarios: string[];
  failuresFoundAndFixed: string[];
  cleanup: 'completed';
};
