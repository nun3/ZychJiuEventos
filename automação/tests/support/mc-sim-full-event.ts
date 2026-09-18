export const MC_SIM_FULL_EVENT_PREFIX = 'MC-SIM Full Event';

export type McSimFullEventIdentity = {
  revision: 'full-event';
  runId: string;
  eventId: string;
  eventName: string;
  organizationId: string;
  ruleSetId: string;
  teamIds: string[];
  teamNames: string[];
  categoryIds: {
    final2: string;
    copo3: string;
    semi4: string;
  };
  categoryNames: {
    final2: string;
    copo3: string;
    semi4: string;
  };
  athleteIds: string[];
  athleteNames: string[];
  registrationIds: string[];
};

export type McSimFullEventReport = {
  identity: Pick<McSimFullEventIdentity, 'revision' | 'runId' | 'eventName'>;
  ok: boolean;
  durationMs: number;
  steps: string[];
  failuresFoundAndFixed: string[];
  cleanup: {
    status: 'completed' | 'failed';
    residualCount: number;
  };
};
