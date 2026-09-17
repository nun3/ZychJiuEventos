import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export const MC_SIM_R2_EVENT_NAME = 'MC-SIM r2 — Realocação operacional';
export const MC_SIM_R2_IDENTITY_PATH = path.resolve(__dirname, 'mc-sim-r2.identity.json');

export type McSimR2Identity = {
  revision: 'r2';
  eventId: string;
  eventName: string;
  organizationId: string;
  organizationName?: string;
  status?: string;
  ruleSetId: string;
  categoryIds: { leve: string; medio: string };
  teamIds: { alfa: string; beta: string };
  athleteIds: { a: string; b: string; c: string };
  registrationIds: { a: string; b: string; c: string };
  paymentId?: string | null;
  rejectedRequestId?: string | null;
  approvedRequestId?: string | null;
  changeRequestId?: string | null;
  checagemLockedAt?: string | null;
  createdVia?: string;
};

export function loadMcSimR2Identity(): McSimR2Identity {
  if (!existsSync(MC_SIM_R2_IDENTITY_PATH)) {
    throw new Error('MC-SIM r2 ainda não foi bootstrapado. Rode npm run mc-sim:r2:bootstrap.');
  }
  const parsed = JSON.parse(readFileSync(MC_SIM_R2_IDENTITY_PATH, 'utf8')) as Partial<McSimR2Identity>;
  if (parsed.revision !== 'r2' || !parsed.eventId) {
    throw new Error('Identidade MC-SIM r2 inválida.');
  }
  return parsed as McSimR2Identity;
}

export function writeMcSimR2Identity(next: McSimR2Identity) {
  if (next.revision !== 'r2') throw new Error('Identidade r2 recusou revision diferente.');
  writeFileSync(MC_SIM_R2_IDENTITY_PATH, `${JSON.stringify(next, null, 2)}\n`);
}
