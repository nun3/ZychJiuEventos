import identity from './mc-sim.identity.json';

export const MC_SIM_EVENT_NAME = 'MC-SIM — Competição canônica';

export type McSimIdentity = {
  eventId: string;
  eventName: string;
  organizationId: string;
  organizationName?: string;
  status?: string;
  ruleSetId?: string | null;
  categoryId?: string | null;
  categoryName?: string;
  reused?: boolean;
};

export function loadMcSimIdentity(): McSimIdentity {
  if (!('eventId' in identity) || !identity.eventId) {
    throw new Error('MC-SIM ainda não foi bootstrapado. Rode npm run mc-sim:bootstrap.');
  }
  return identity as McSimIdentity;
}
