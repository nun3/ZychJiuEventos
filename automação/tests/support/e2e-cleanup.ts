import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { BrowserContext } from '@playwright/test';
import type { Database } from '../../../lib/supabase/database.types';

export const SANDBOX_HOST = 'kfvypacjzlzwwblsbpwj.supabase.co';

const EVENT_PREFIXES = ['Evento E2E ', 'Checkout E2E', 'Checagem E2E', 'MC-SIM Full Event'] as const;
const ATHLETE_PREFIXES = ['Atleta E2E ', 'MC-SIM Full Event Atleta'] as const;
const TEAM_PREFIXES = ['E2E Equipe ', 'MC-SIM Full Event Equipe'] as const;
const ORG_EXACT = ['Checkout E2E', 'Checagem E2E', 'Checagem Pública E2E', 'Operação E2E', 'Fechamento E2E', 'Taxa E2E', 'Professor E2E evento', 'Operacional E2E evento'] as const;

export type CleanupPlan = {
  protectedOrgIds: string[];
  ownerUserId: string;
  events: Array<{ id: string; nome: string; organization_id: string }>;
  registrations: string[];
  payments: string[];
  categories: string[];
  ruleSets: string[];
  athletes: Array<{ id: string; nome_completo: string; organization_id: string; team_id: string | null }>;
  teams: Array<{ id: string; nome: string; organization_id: string }>;
  disposableOrgs: Array<{ id: string; nome: string }>;
  auditLogIds: number[];
  changeRequestIds: string[];
  storagePaths: string[];
  phaseIds: string[];
  issuanceJobPaymentIds: string[];
  attemptIds: string[];
  managerAthleteIds: string[];
};

function loadEnvFile(file: string) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const normalized = line.trim();
    if (!normalized || normalized.startsWith('#') || !normalized.includes('=')) continue;
    const i = normalized.indexOf('=');
    const key = normalized.slice(0, i).trim();
    const value = normalized.slice(i + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

export function loadCleanupEnv() {
  const root = path.resolve(__dirname, '../../..');
  loadEnvFile(path.join(root, '.env.local'));
  loadEnvFile(path.join(root, 'automação/.env.e2e'));
}

export function assertSandboxUrl(url: string) {
  let host = '';
  try { host = new URL(url).hostname; } catch { throw new Error('URL Supabase inválida.'); }
  if (host !== SANDBOX_HOST) throw new Error(`Cleanup abortado: host ${host} não é o Sandbox autorizado.`);
}

function startsWithAny(value: string, prefixes: readonly string[]) {
  return prefixes.some((prefix) => value === prefix || value.startsWith(prefix));
}

function unique(ids: string[]) {
  return [...new Set(ids.filter(Boolean))];
}

async function must<T>(label: string, result: PromiseLike<{ data: T; error: { message: string } | null }>) {
  const { data, error } = await result;
  if (error) throw new Error(`${label}: ${error.message}`);
  return data;
}

export async function createCleanupClients() {
  loadCleanupEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  assertSandboxUrl(url);
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  const admin = createClient<Database>(url, process.env.SUPABASE_SECRET_KEY || '', options);
  const actor = createClient<Database>(url, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '', options);
  return { admin, actor };
}

export async function resolveOwnerId(actor: SupabaseClient<Database>) {
  const email = process.env.E2E_OWNER_EMAIL || '';
  const password = process.env.E2E_OWNER_PASSWORD || '';
  if (!email || !password) throw new Error('E2E_OWNER_EMAIL/PASSWORD ausentes.');
  const { data, error } = await actor.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw new Error(`Login owner: ${error?.message || 'falhou'}`);
  return data.user.id;
}

export async function applyOwnerSession(context: BrowserContext, baseURL: string) {
  const { actor } = await createCleanupClients();
  await resolveOwnerId(actor);
  const { data: { session } } = await actor.auth.getSession();
  if (!session) throw new Error('Sessão owner ausente.');
  await context.addCookies([{
    name: `sb-${SANDBOX_HOST.split('.')[0]}-auth-token`,
    value: JSON.stringify(session),
    url: baseURL,
    httpOnly: false,
    secure: false,
    sameSite: 'Lax',
  }]);
}

export async function deleteEventOperationalGraph(admin: SupabaseClient<Database>, eventIds: string[]) {
  const ids = unique(eventIds);
  if (!ids.length) return;
  await checked('cleanup schedules', admin.from('event_schedules').delete().in('event_id', ids));
  const { data: brackets, error: bracketError } = await admin.from('category_brackets').select('id').in('event_id', ids);
  if (bracketError) throw new Error(`cleanup brackets lookup: ${bracketError.message}`);
  const bracketIds = (brackets || []).map((row) => row.id);
  if (!bracketIds.length) return;
  const { data: groups, error: groupError } = await admin.from('bracket_groups').select('id').in('bracket_id', bracketIds);
  if (groupError) throw new Error(`cleanup groups lookup: ${groupError.message}`);
  const groupIds = (groups || []).map((row) => row.id);
  if (groupIds.length) await checked('cleanup matches', admin.from('bracket_matches').delete().in('group_id', groupIds));
  await checked('cleanup entries', admin.from('bracket_entries').delete().in('bracket_id', bracketIds));
  if (groupIds.length) await checked('cleanup groups', admin.from('bracket_groups').delete().in('id', groupIds));
  await checked('cleanup participants', admin.from('bracket_participants').delete().in('bracket_id', bracketIds));
  await checked('cleanup brackets', admin.from('category_brackets').delete().in('id', bracketIds));
}

export async function buildCleanupPlan(admin: SupabaseClient<Database>, ownerUserId: string): Promise<CleanupPlan> {
  const memberships = await must('members', admin.from('organization_members').select('organization_id, role').eq('user_id', ownerUserId));
  const ownerOrgIds = unique((memberships || []).map((row) => row.organization_id));
  const ownerOrgs = ownerOrgIds.length
    ? await must('owner orgs', admin.from('organizations').select('id, nome').in('id', ownerOrgIds))
    : [];
  const protectedOrgIds = (ownerOrgs || [])
    .filter((org) => !ORG_EXACT.includes(org.nome as typeof ORG_EXACT[number]) && !startsWithAny(org.nome, ORG_EXACT))
    .map((org) => org.id);
  if (!protectedOrgIds.length) throw new Error('Nenhuma organização permanente do owner encontrada. Cleanup abortado.');

  const allOrgs = await must('orgs', admin.from('organizations').select('id, nome'));
  const disposableOrgs = (allOrgs || []).filter((org) => ORG_EXACT.includes(org.nome as typeof ORG_EXACT[number]) || startsWithAny(org.nome, ['Checkout E2E', 'Checagem E2E', 'Professor E2E']));
  if (disposableOrgs.some((org) => protectedOrgIds.includes(org.id))) {
    throw new Error('Organização permanente do owner coincidiu com org técnica. Cleanup abortado.');
  }

  const allEvents = await must('events', admin.from('events').select('id, nome, organization_id'));
  const namedEvents = (allEvents || []).filter((event) => startsWithAny(event.nome, EVENT_PREFIXES));
  const orgEventIds = (allEvents || []).filter((event) => disposableOrgs.some((org) => org.id === event.organization_id)).map((event) => event.id);
  const events = unique([...namedEvents.map((event) => event.id), ...orgEventIds])
    .map((id) => (allEvents || []).find((event) => event.id === id)!)
    .filter(Boolean);
  if (events.some((event) => !event.organization_id)) throw new Error('Evento sem organização.');

  const eventIds = events.map((event) => event.id);
  const registrations = eventIds.length
    ? await must('registrations', admin.from('registrations').select('id, athlete_id, category_id').in('event_id', eventIds))
    : [];
  const registrationIds = (registrations || []).map((row) => row.id);
  const payments = eventIds.length
    ? await must('payments', admin.from('payments').select('id').in('event_id', eventIds))
    : [];
  const paymentIds = (payments || []).map((row) => row.id);
  const ruleSets = eventIds.length
    ? await must('rules', admin.from('category_rule_sets').select('id').in('event_id', eventIds))
    : [];
  const ruleSetIds = (ruleSets || []).map((row) => row.id);
  const categories = ruleSetIds.length
    ? await must('categories', admin.from('event_categories').select('id').in('rule_set_id', ruleSetIds))
    : [];
  const categoryIds = unique([
    ...(categories || []).map((row) => row.id),
    ...(registrations || []).map((row) => row.category_id),
  ]);
  const changeRequests = registrationIds.length
    ? await must('changes', admin.from('category_change_requests').select('id').in('registration_id', registrationIds))
    : [];
  const auditLogs = eventIds.length
    ? await must('audit', admin.from('event_audit_logs').select('id').in('event_id', eventIds))
    : [];

  const allAthletes = await must('athletes', admin.from('athletes').select('id, nome_completo, organization_id, team_id'));
  const namedAthletes = (allAthletes || []).filter((athlete) => startsWithAny(athlete.nome_completo, ATHLETE_PREFIXES));
  const orgAthletes = (allAthletes || []).filter((athlete) => disposableOrgs.some((org) => org.id === athlete.organization_id));
  const registrationAthletes = (allAthletes || []).filter((athlete) => (registrations || []).some((row) => row.athlete_id === athlete.id));
  const athletes = unique([...namedAthletes, ...orgAthletes, ...registrationAthletes].map((athlete) => athlete.id))
    .map((id) => (allAthletes || []).find((athlete) => athlete.id === id)!)
    .filter(Boolean);

  const leftoverRegs = athletes.length
    ? await must('athlete regs', admin.from('registrations').select('id, event_id').in('athlete_id', athletes.map((athlete) => athlete.id)))
    : [];
  const leftoverEventIds = unique((leftoverRegs || []).map((row) => row.event_id).filter((id) => !eventIds.includes(id)));
  if (leftoverEventIds.length) {
    throw new Error(`Atleta E2E ainda vinculado a evento fora do recorte (${leftoverEventIds.join(', ')}). Cleanup abortado.`);
  }

  const allTeams = await must('teams', admin.from('teams').select('id, nome, organization_id'));
  const namedTeams = (allTeams || []).filter((team) => startsWithAny(team.nome, TEAM_PREFIXES));
  const orgTeams = (allTeams || []).filter((team) => disposableOrgs.some((org) => org.id === team.organization_id));
  const teams = unique([...namedTeams, ...orgTeams].map((team) => team.id))
    .map((id) => (allTeams || []).find((team) => team.id === id)!)
    .filter(Boolean);

  const otherAthletesOnTeams = (allAthletes || []).filter((athlete) => teams.some((team) => team.id === athlete.team_id) && !athletes.some((item) => item.id === athlete.id));
  if (otherAthletesOnTeams.length) {
    throw new Error('Equipe E2E contém atleta fora do recorte. Cleanup abortado.');
  }

  const storagePaths: string[] = [];
  for (const event of events) {
    const folder = `${event.organization_id}/${event.id}`;
    const listed = await admin.storage.from('event-assets').list(folder);
    if (!listed.error) {
      for (const object of listed.data || []) {
        if (object.name) storagePaths.push(`${folder}/${object.name}`);
      }
    }
  }

  const phases = eventIds.length
    ? await must('phases', admin.from('event_phases').select('id').in('event_id', eventIds))
    : [];
  const issuanceJobs = paymentIds.length
    ? await must('jobs', admin.from('payment_issuance_jobs').select('payment_id').in('payment_id', paymentIds))
    : [];
  const attempts = paymentIds.length
    ? await must('attempts', admin.from('payment_attempts').select('id').in('payment_id', paymentIds))
    : [];
  const managers = athletes.length
    ? await must('managers', admin.from('athlete_managers').select('athlete_id, manager_id').in('athlete_id', athletes.map((athlete) => athlete.id)))
    : [];

  return {
    protectedOrgIds,
    ownerUserId,
    events,
    registrations: registrationIds,
    payments: paymentIds,
    categories: categoryIds,
    ruleSets: ruleSetIds,
    athletes,
    teams,
    disposableOrgs,
    auditLogIds: (auditLogs || []).map((row) => row.id),
    changeRequestIds: (changeRequests || []).map((row) => row.id),
    storagePaths,
    phaseIds: (phases || []).map((row) => row.id),
    issuanceJobPaymentIds: (issuanceJobs || []).map((row) => row.payment_id),
    attemptIds: (attempts || []).map((row) => row.id),
    managerAthleteIds: unique((managers || []).map((row) => row.athlete_id)),
  };
}

export async function buildCleanupPlanFromExactIds(
  admin: SupabaseClient<Database>,
  input: {
    eventIds: string[];
    organizationIds: string[];
    athleteIds?: string[];
    teamIds?: string[];
    protectedEventIds: string[];
    protectedOrgIds: string[];
  },
): Promise<CleanupPlan> {
  const eventIds = unique(input.eventIds);
  const organizationIds = unique(input.organizationIds);
  const extraAthleteIds = unique(input.athleteIds || []);
  const extraTeamIds = unique(input.teamIds || []);
  if (eventIds.some((id) => input.protectedEventIds.includes(id))) {
    throw new Error('ID protegido (MC-SIM) na lista de eventos. Cleanup abortado.');
  }
  if (organizationIds.some((id) => input.protectedOrgIds.includes(id))) {
    throw new Error('Organização permanente na lista de exclusão. Cleanup abortado.');
  }

  const events = eventIds.length
    ? await must('events by id', admin.from('events').select('id, nome, organization_id').in('id', eventIds))
    : [];
  if ((events || []).length !== eventIds.length) throw new Error('Evento informado não encontrado.');
  if ((events || []).some((event) => input.protectedEventIds.includes(event.id))) {
    throw new Error('Evento protegido no recorte. Cleanup abortado.');
  }

  const registrations = eventIds.length
    ? await must('registrations', admin.from('registrations').select('id, athlete_id, category_id').in('event_id', eventIds))
    : [];
  const registrationIds = (registrations || []).map((row) => row.id);
  const payments = eventIds.length
    ? await must('payments', admin.from('payments').select('id').in('event_id', eventIds))
    : [];
  const paymentIds = (payments || []).map((row) => row.id);
  const ruleSets = eventIds.length
    ? await must('rules', admin.from('category_rule_sets').select('id').in('event_id', eventIds))
    : [];
  const ruleSetIds = (ruleSets || []).map((row) => row.id);
  const categories = ruleSetIds.length
    ? await must('categories', admin.from('event_categories').select('id').in('rule_set_id', ruleSetIds))
    : [];
  const categoryIds = unique([
    ...(categories || []).map((row) => row.id),
    ...(registrations || []).map((row) => row.category_id),
  ]);
  const changeRequests = registrationIds.length
    ? await must('changes', admin.from('category_change_requests').select('id').in('registration_id', registrationIds))
    : [];
  const auditLogs = eventIds.length
    ? await must('audit', admin.from('event_audit_logs').select('id').in('event_id', eventIds))
    : [];

  const orgAthletes = organizationIds.length
    ? await must('org athletes', admin.from('athletes').select('id, nome_completo, organization_id, team_id').in('organization_id', organizationIds))
    : [];
  const extraAthletes = extraAthleteIds.length
    ? await must('extra athletes', admin.from('athletes').select('id, nome_completo, organization_id, team_id').in('id', extraAthleteIds))
    : [];
  const registrationAthletes = (registrations || []).length
    ? await must('reg athletes', admin.from('athletes').select('id, nome_completo, organization_id, team_id').in('id', unique((registrations || []).map((row) => row.athlete_id))))
    : [];
  const athletes = unique([...(orgAthletes || []), ...(extraAthletes || []), ...(registrationAthletes || [])].map((athlete) => athlete.id))
    .map((id) => [...(orgAthletes || []), ...(extraAthletes || []), ...(registrationAthletes || [])].find((athlete) => athlete.id === id)!)
    .filter(Boolean);
  if (athletes.some((athlete) => !athlete)) throw new Error('Atleta informado não encontrado.');

  const leftoverRegs = athletes.length
    ? await must('athlete regs', admin.from('registrations').select('id, event_id').in('athlete_id', athletes.map((athlete) => athlete.id)))
    : [];
  const leftoverEventIds = unique((leftoverRegs || []).map((row) => row.event_id).filter((id) => !eventIds.includes(id)));
  if (leftoverEventIds.some((id) => input.protectedEventIds.includes(id))) {
    throw new Error('Atleta ainda vinculado ao MC-SIM. Cleanup abortado.');
  }
  if (leftoverEventIds.length) {
    throw new Error(`Atleta ainda vinculado a evento fora do recorte (${leftoverEventIds.join(', ')}). Cleanup abortado.`);
  }

  const orgTeams = organizationIds.length
    ? await must('org teams', admin.from('teams').select('id, nome, organization_id').in('organization_id', organizationIds))
    : [];
  const extraTeams = extraTeamIds.length
    ? await must('extra teams', admin.from('teams').select('id, nome, organization_id').in('id', extraTeamIds))
    : [];
  const teams = unique([...(orgTeams || []), ...(extraTeams || [])].map((team) => team.id))
    .map((id) => [...(orgTeams || []), ...(extraTeams || [])].find((team) => team.id === id)!)
    .filter(Boolean);

  const otherAthletesOnTeams = (await must('all athletes', admin.from('athletes').select('id, team_id')) || [])
    .filter((athlete) => teams.some((team) => team.id === athlete.team_id) && !athletes.some((item) => item.id === athlete.id));
  if (otherAthletesOnTeams.length) {
    throw new Error('Equipe do recorte contém atleta fora dos IDs informados. Cleanup abortado.');
  }

  const orgs = organizationIds.length
    ? await must('orgs by id', admin.from('organizations').select('id, nome').in('id', organizationIds))
    : [];
  if ((orgs || []).length !== organizationIds.length) throw new Error('Organização informada não encontrada.');

  const storagePaths: string[] = [];
  for (const event of events || []) {
    const folder = `${event.organization_id}/${event.id}`;
    const listed = await admin.storage.from('event-assets').list(folder);
    if (!listed.error) {
      for (const object of listed.data || []) {
        if (object.name) storagePaths.push(`${folder}/${object.name}`);
      }
    }
  }

  const phases = eventIds.length
    ? await must('phases', admin.from('event_phases').select('id').in('event_id', eventIds))
    : [];
  const issuanceJobs = paymentIds.length
    ? await must('jobs', admin.from('payment_issuance_jobs').select('payment_id').in('payment_id', paymentIds))
    : [];
  const attempts = paymentIds.length
    ? await must('attempts', admin.from('payment_attempts').select('id').in('payment_id', paymentIds))
    : [];
  const managers = athletes.length
    ? await must('managers', admin.from('athlete_managers').select('athlete_id, manager_id').in('athlete_id', athletes.map((athlete) => athlete.id)))
    : [];

  return {
    protectedOrgIds: input.protectedOrgIds,
    ownerUserId: '',
    events: events || [],
    registrations: registrationIds,
    payments: paymentIds,
    categories: categoryIds,
    ruleSets: ruleSetIds,
    athletes,
    teams,
    disposableOrgs: orgs || [],
    auditLogIds: (auditLogs || []).map((row) => row.id),
    changeRequestIds: (changeRequests || []).map((row) => row.id),
    storagePaths,
    phaseIds: (phases || []).map((row) => row.id),
    issuanceJobPaymentIds: (issuanceJobs || []).map((row) => row.payment_id),
    attemptIds: (attempts || []).map((row) => row.id),
    managerAthleteIds: unique((managers || []).map((row) => row.athlete_id)),
  };
}

export function summarizePlan(plan: CleanupPlan) {
  return {
    protectedOrgs: plan.protectedOrgIds.length,
    events: plan.events.map((event) => ({ id: event.id, nome: event.nome, parent: event.organization_id })),
    registrations: plan.registrations.length,
    payments: plan.payments.length,
    categories: plan.categories.length,
    ruleSets: plan.ruleSets.length,
    athletes: plan.athletes.map((athlete) => ({ id: athlete.id, nome: athlete.nome_completo, parent: athlete.organization_id })),
    teams: plan.teams.map((team) => ({ id: team.id, nome: team.nome, parent: team.organization_id })),
    disposableOrgs: plan.disposableOrgs,
    auditLogs: plan.auditLogIds.length,
    changeRequests: plan.changeRequestIds.length,
    storageObjects: plan.storagePaths.length,
    phases: plan.phaseIds.length,
    issuanceJobs: plan.issuanceJobPaymentIds.length,
    paymentAttempts: plan.attemptIds.length,
    athleteManagers: plan.managerAthleteIds.length,
  };
}

async function checked(label: string, result: PromiseLike<{ error: { message: string } | null }>) {
  const { error } = await result;
  if (error) throw new Error(`${label}: ${error.message}`);
}

export async function executeCleanup(admin: SupabaseClient<Database>, plan: CleanupPlan) {
  const eventIds = plan.events.map((event) => event.id);
  const athleteIds = plan.athletes.map((athlete) => athlete.id);
  const teamIds = plan.teams.map((team) => team.id);
  const orgIds = plan.disposableOrgs.map((org) => org.id);

  await deleteEventOperationalGraph(admin, eventIds);
  if (plan.changeRequestIds.length) await checked('change requests', admin.from('category_change_requests').delete().in('id', plan.changeRequestIds));
  if (plan.auditLogIds.length) await checked('audit', admin.from('event_audit_logs').delete().in('id', plan.auditLogIds));
  if (plan.registrations.length) await checked('payment_registrations', admin.from('payment_registrations').delete().in('registration_id', plan.registrations));
  if (plan.issuanceJobPaymentIds.length) await checked('issuance jobs', admin.from('payment_issuance_jobs').delete().in('payment_id', plan.issuanceJobPaymentIds));
  if (plan.attemptIds.length) await checked('attempts', admin.from('payment_attempts').delete().in('id', plan.attemptIds));
  if (plan.payments.length) await checked('payments', admin.from('payments').delete().in('id', plan.payments));
  if (plan.registrations.length) await checked('registrations', admin.from('registrations').delete().in('id', plan.registrations));
  if (plan.categories.length) await checked('categories', admin.from('event_categories').delete().in('id', plan.categories));
  if (plan.ruleSets.length) await checked('rules', admin.from('category_rule_sets').delete().in('id', plan.ruleSets));
  if (plan.phaseIds.length) await checked('phases', admin.from('event_phases').delete().in('id', plan.phaseIds));
  if (plan.storagePaths.length) {
    const removed = await admin.storage.from('event-assets').remove(plan.storagePaths);
    if (removed.error) throw new Error(`storage: ${removed.error.message}`);
  }
  if (eventIds.length) await checked('events', admin.from('events').delete().in('id', eventIds));
  if (plan.managerAthleteIds.length) await checked('managers', admin.from('athlete_managers').delete().in('athlete_id', plan.managerAthleteIds));
  if (athleteIds.length) await checked('athletes', admin.from('athletes').delete().in('id', athleteIds));
  if (teamIds.length) await checked('teams', admin.from('teams').delete().in('id', teamIds));
  if (orgIds.length) await checked('members', admin.from('organization_members').delete().in('organization_id', orgIds));
  if (orgIds.length) await checked('orgs', admin.from('organizations').delete().in('id', orgIds));
}
