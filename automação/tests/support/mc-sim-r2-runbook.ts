import { createCleanupClients, loadCleanupEnv, resolveOwnerId } from './e2e-cleanup';
import { requireE2eWrites } from './e2e-writes';
import { loadMcSimIdentity } from './mc-sim';
import { loadMcSimR2Identity, writeMcSimR2Identity, type McSimR2Identity } from './mc-sim-r2';

const TEAM_ALFA = 'MC-SIM r2 Equipe Alfa';
const TEAM_BETA = 'MC-SIM r2 Equipe Beta';
const LEVE_NAME = 'MC-SIM r2 Adulto Leve';
const MEDIO_NAME = 'MC-SIM r2 Adulto Médio';
const FEE = 80;
const TERMS = 'MVP-2026-09';
const SETTLE_REASON = 'Baixa controlada do runbook MC-SIM r2 no Sandbox, sem emissão Asaas Live.';
const REQUEST_REASON = 'Atleta A sozinho no Leve do MC-SIM r2; solicitar Médio adjacente.';

const ATHLETES = {
  a: { nome: 'MC-SIM r2 Atleta A', team: 'alfa' as const, nascimento: '2002-03-15', peso: 70, faixa: 'Branca', genero: 'M' },
  b: { nome: 'MC-SIM r2 Atleta B', team: 'alfa' as const, nascimento: '2001-08-20', peso: 82, faixa: 'Branca', genero: 'M' },
  c: { nome: 'MC-SIM r2 Atleta C', team: 'beta' as const, nascimento: '2000-01-10', peso: 82, faixa: 'Branca', genero: 'M' },
} as const;

function must<T>(label: string, error: { message: string } | null, data: T | null | undefined): T {
  if (error || data == null) throw new Error(`${label}: ${error?.message || 'sem dados'}`);
  return data;
}

function hoursFromNow(hours: number) {
  return new Date(Date.now() + hours * 3600_000).toISOString();
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function jsonKind(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Resposta RPC inválida.');
  return value as Record<string, unknown>;
}

async function clients() {
  const { admin, actor } = await createCleanupClients();
  const ownerUserId = await resolveOwnerId(actor);
  const r1 = loadMcSimIdentity();
  const identity = loadMcSimR2Identity();
  if (identity.eventId === r1.eventId) throw new Error('Identidade r2 aponta para o evento r1.');
  const loaded = await admin.from('events').select('id, nome, status, organization_id, valor_inscricao, data_evento, checagem_travada_em').eq('id', identity.eventId).single();
  const event = must('MC-SIM r2', loaded.error, loaded.data);
  const r1Event = await admin.from('events').select('id, status, checagem_travada_em').eq('id', r1.eventId).single();
  if (r1Event.data?.checagem_travada_em !== r1.checagemLockedAt && r1.checagemLockedAt) {
    if (!r1Event.data?.checagem_travada_em) throw new Error('MC-SIM r1 perdeu o travamento.');
  }
  return { admin, actor, identity, event, ownerUserId, r1 };
}

async function teamBy(
  actor: Awaited<ReturnType<typeof clients>>['actor'],
  admin: Awaited<ReturnType<typeof clients>>['admin'],
  orgId: string,
  ownerUserId: string,
  id: string | undefined,
  nome: string,
) {
  if (id) {
    const known = await admin.from('teams').select('id, nome').eq('id', id).maybeSingle();
    if (known.data?.id) return known.data;
  }
  const named = await admin.from('teams').select('id, nome').eq('organization_id', orgId).eq('nome', nome).maybeSingle();
  if (named.data?.id) return named.data;
  const created = await actor.from('teams').insert({ nome, organization_id: orgId, created_by: ownerUserId }).select('id, nome').single();
  return must(`equipe ${nome}`, created.error, created.data);
}

async function athleteBy(
  actor: Awaited<ReturnType<typeof clients>>['actor'],
  admin: Awaited<ReturnType<typeof clients>>['admin'],
  orgId: string,
  knownId: string | undefined,
  spec: (typeof ATHLETES)[keyof typeof ATHLETES],
  teamId: string,
) {
  if (knownId) {
    const known = await admin.from('athletes').select('id').eq('id', knownId).maybeSingle();
    if (known.data?.id) return known.data.id;
  }
  const named = await admin.from('athletes').select('id').eq('organization_id', orgId).eq('nome_completo', spec.nome).maybeSingle();
  if (named.data?.id) return named.data.id;
  const created = await actor.rpc('create_managed_athlete', {
    target_team_id: teamId,
    athlete_name: spec.nome,
    athlete_birth_date: spec.nascimento,
    athlete_gender: spec.genero,
    athlete_belt: spec.faixa,
    athlete_weight: spec.peso,
    relationship: 'professor',
  });
  return must(`atleta ${spec.nome}`, created.error, created.data);
}

export async function ensureParticipants() {
  const { admin, actor, identity, event, ownerUserId } = await clients();
  const orgId = event.organization_id;
  const alfa = await teamBy(actor, admin, orgId, ownerUserId, identity.teamIds.alfa, TEAM_ALFA);
  const beta = await teamBy(actor, admin, orgId, ownerUserId, identity.teamIds.beta, TEAM_BETA);
  const athleteIds = {
    a: await athleteBy(actor, admin, orgId, identity.athleteIds.a, ATHLETES.a, alfa.id),
    b: await athleteBy(actor, admin, orgId, identity.athleteIds.b, ATHLETES.b, alfa.id),
    c: await athleteBy(actor, admin, orgId, identity.athleteIds.c, ATHLETES.c, beta.id),
  };
  const next: McSimR2Identity = { ...identity, teamIds: { alfa: alfa.id, beta: beta.id }, athleteIds };
  writeMcSimR2Identity(next);
  return { stage: 'participants', identity: next };
}

export async function ensureRegistrations() {
  const { admin, actor, identity, event } = await clients();
  if (identity.registrationIds.a && identity.registrationIds.b && identity.registrationIds.c) {
    const existing = await admin.from('registrations').select('id, status, athlete_id, category_id, valor, athlete_snapshot, category_snapshot, numero').in('id', Object.values(identity.registrationIds));
    if ((existing.data || []).length === 3) {
      return { stage: 'registrations', reused: true, identity, registrations: existing.data };
    }
  }
  if (!identity.athleteIds.a) throw new Error('Participantes r2 ausentes. Rode npm run mc-sim:r2:participants.');
  if (Number(event.valor_inscricao) !== FEE) {
    const updated = await actor.from('events').update({ valor_inscricao: FEE }).eq('id', event.id);
    if (updated.error) throw new Error(`valor inscrição: ${updated.error.message}`);
  }

  const inscription = await admin.from('event_phases').select('id, inicio, fim').eq('event_id', event.id).eq('tipo', 'inscricao').single();
  if (inscription.error || !inscription.data) throw new Error('Fase de inscrição inexistente.');
  const now = Date.now();
  if (now < Date.parse(inscription.data.inicio) || now > Date.parse(inscription.data.fim)) {
    const shifted = await actor.from('event_phases').update({ inicio: hoursFromNow(-2), fim: hoursFromNow(24 * 14) }).eq('id', inscription.data.id);
    if (shifted.error) throw new Error(`fase inscrição: ${shifted.error.message}`);
  }
  if (event.status === 'publicado') {
    const opened = await actor.from('events').update({ status: 'inscricao' }).eq('id', event.id);
    if (opened.error) throw new Error(`abrir inscrições: ${opened.error.message}`);
  } else if (event.status !== 'inscricao') {
    throw new Error(`r2 em ${event.status}; inscrições exigem publicado ou inscricao.`);
  }

  const created = await actor.rpc('create_event_registrations', {
    target_event_id: event.id,
    target_athlete_ids: [identity.athleteIds.a, identity.athleteIds.b, identity.athleteIds.c],
    accepted_terms_version: TERMS,
    terms_accepted: true,
  });
  const rows = must('inscrições', created.error, created.data);
  const byAthlete = new Map(rows.map((row) => [row.athlete_id, row]));
  const registrationIds = {
    a: must('inscrição A', null, byAthlete.get(identity.athleteIds.a)?.registration_id),
    b: must('inscrição B', null, byAthlete.get(identity.athleteIds.b)?.registration_id),
    c: must('inscrição C', null, byAthlete.get(identity.athleteIds.c)?.registration_id),
  };
  if (byAthlete.get(identity.athleteIds.a)?.category_id !== identity.categoryIds.leve) {
    throw new Error('Atleta A não foi alocado no Leve.');
  }
  if (byAthlete.get(identity.athleteIds.b)?.category_id !== identity.categoryIds.medio
    || byAthlete.get(identity.athleteIds.c)?.category_id !== identity.categoryIds.medio) {
    throw new Error('Atletas B/C não foram alocados no Médio.');
  }
  const next: McSimR2Identity = { ...identity, status: 'inscricao', registrationIds };
  writeMcSimR2Identity(next);
  const stored = await admin.from('registrations').select('id, status, athlete_id, category_id, valor, athlete_snapshot, category_snapshot, numero').in('id', Object.values(registrationIds));
  return { stage: 'registrations', reused: false, identity: next, registrations: stored.data };
}

export async function ensureSettlement() {
  const { admin, actor, identity, event } = await clients();
  const ids = Object.values(identity.registrationIds).filter(Boolean);
  if (ids.length !== 3) throw new Error('Inscrições r2 ausentes. Rode npm run mc-sim:r2:registrations.');
  const loaded = await admin.from('registrations').select('id, status, athlete_id, category_id, valor, athlete_snapshot, category_snapshot').in('id', ids);
  const rows = loaded.data || [];
  if (rows.length !== 3) throw new Error('Inscrições da identidade r2 não encontradas.');
  if (rows.every((row) => row.status === 'efetivada')) {
    return { stage: 'settle', reused: true, identity, registrations: rows, paymentId: identity.paymentId || null };
  }

  const paymentPhase = await admin.from('event_phases').select('id, inicio, fim').eq('event_id', event.id).eq('tipo', 'pagamento').single();
  if (paymentPhase.error || !paymentPhase.data) throw new Error('Fase de pagamento inexistente.');
  const now = Date.now();
  if (now < Date.parse(paymentPhase.data.inicio) || now > Date.parse(paymentPhase.data.fim)) {
    const inscription = await admin.from('event_phases').select('id').eq('event_id', event.id).eq('tipo', 'inscricao').single();
    if (inscription.data?.id) {
      const close = await actor.from('event_phases').update({ inicio: hoursFromNow(-48), fim: hoursFromNow(-1) }).eq('id', inscription.data.id);
      if (close.error) throw new Error(`fechar inscrição: ${close.error.message}`);
    }
    const shifted = await actor.from('event_phases').update({ inicio: hoursFromNow(-2), fim: hoursFromNow(24 * 14) }).eq('id', paymentPhase.data.id);
    if (shifted.error) throw new Error(`fase pagamento: ${shifted.error.message}`);
  }
  if (event.status === 'inscricao') {
    const moved = await actor.from('events').update({ status: 'pagamento' }).eq('id', event.id);
    if (moved.error) throw new Error(`fase pagamento status: ${moved.error.message}`);
  } else if (event.status !== 'pagamento') {
    throw new Error(`r2 em ${event.status}; reserva exige pagamento.`);
  }

  const pending = rows.filter((row) => row.status === 'pendente_pagamento').map((row) => row.id);
  let paymentId = identity.paymentId || null;
  if (paymentId) {
    const existingPay = await admin.from('payments').select('id, status').eq('id', paymentId).maybeSingle();
    if (existingPay.data?.status === 'aguardando') {
      const settled = await actor.rpc('settle_payment_manually', { target_payment_id: paymentId, reason_text: SETTLE_REASON });
      if (settled.error) throw new Error(`baixa: ${settled.error.message}`);
    }
  }
  const stillPending = (await admin.from('registrations').select('id, status').in('id', pending)).data
    ?.filter((row) => row.status === 'pendente_pagamento').map((row) => row.id) || [];
  if (stillPending.length) {
    const reserved = await actor.rpc('reserve_payment_batch', {
      target_event_id: event.id,
      target_registration_ids: stillPending,
      target_method: 'pix',
    });
    paymentId = must('reserva', reserved.error, reserved.data?.[0] || null).payment_id;
    const settled = await actor.rpc('settle_payment_manually', { target_payment_id: paymentId, reason_text: SETTLE_REASON });
    if (settled.error) throw new Error(`baixa: ${settled.error.message}`);
  }
  const after = await admin.from('registrations').select('id, status, athlete_id, category_id, valor, athlete_snapshot, category_snapshot').in('id', ids);
  if ((after.data || []).some((row) => row.status !== 'efetivada')) {
    throw new Error('Nem todas as inscrições r2 ficaram efetivadas.');
  }
  const next: McSimR2Identity = { ...identity, status: 'pagamento', paymentId };
  writeMcSimR2Identity(next);
  return { stage: 'settle', reused: false, identity: next, registrations: after.data, paymentId };
}

export async function officialList() {
  const { admin, identity, event } = await clients();
  const loaded = await admin.from('registrations').select('id, numero, status, athlete_id, category_id, current_category_id, athlete_snapshot, category_snapshot').eq('event_id', event.id).eq('status', 'efetivada').order('numero');
  const rows = loaded.data || [];
  const names = new Map([[identity.categoryIds.leve, LEVE_NAME], [identity.categoryIds.medio, MEDIO_NAME]]);
  const mapped = rows.map((row) => {
    const athlete = asRecord(row.athlete_snapshot);
    const currentId = row.current_category_id || row.category_id;
    return {
      id: row.id,
      numero: row.numero,
      athleteId: row.athlete_id,
      athleteName: String(athlete.nome_completo || ''),
      teamName: String(athlete.team_name || ''),
      categoryId: currentId,
      categoryName: names.get(currentId) || '',
      originalCategoryId: row.category_id,
      originalCategoryName: names.get(row.category_id) || '',
      hasOverride: Boolean(row.current_category_id),
      peso: athlete.peso_kg,
      snapshot: athlete,
    };
  });
  const counts = mapped.reduce<Record<string, number>>((acc, row) => {
    acc[row.categoryName] = (acc[row.categoryName] || 0) + 1;
    return acc;
  }, {});
  return mapped.map((row) => ({ ...row, isAloneInCategory: counts[row.categoryName] === 1 }));
}

export async function ensureChecking() {
  const { admin, actor, identity, event } = await clients();
  const ids = Object.values(identity.registrationIds);
  const before = await admin.from('registrations').select('id, status, category_id, current_category_id, athlete_snapshot, category_snapshot').in('id', ids);
  if ((before.data || []).length !== 3 || (before.data || []).some((row) => row.status !== 'efetivada')) {
    throw new Error('r2 precisa das 3 inscrições efetivadas antes da checagem.');
  }
  const checagemPhase = await admin.from('event_phases').select('id, inicio, fim').eq('event_id', event.id).eq('tipo', 'checagem').single();
  if (checagemPhase.error || !checagemPhase.data) throw new Error('Fase de checagem inexistente.');
  const now = Date.now();
  if (now < Date.parse(checagemPhase.data.inicio) || now > Date.parse(checagemPhase.data.fim)) {
    const paymentPhase = await admin.from('event_phases').select('id').eq('event_id', event.id).eq('tipo', 'pagamento').single();
    if (paymentPhase.data?.id) {
      const close = await actor.from('event_phases').update({ inicio: hoursFromNow(-48), fim: hoursFromNow(-1) }).eq('id', paymentPhase.data.id);
      if (close.error) throw new Error(`fechar pagamento: ${close.error.message}`);
    }
    const shifted = await actor.from('event_phases').update({ inicio: hoursFromNow(-2), fim: hoursFromNow(24 * 14) }).eq('id', checagemPhase.data.id);
    if (shifted.error) throw new Error(`fase checagem: ${shifted.error.message}`);
  }
  let reused = event.status === 'checagem';
  if (event.status === 'pagamento') {
    const moved = await actor.from('events').update({ status: 'checagem' }).eq('id', event.id);
    if (moved.error) throw new Error(`abrir checagem: ${moved.error.message}`);
    reused = false;
  } else if (event.status !== 'checagem') {
    throw new Error(`r2 em ${event.status}; checagem exige pagamento ou checagem.`);
  }
  const afterRegs = await admin.from('registrations').select('id, status, category_id, current_category_id, athlete_snapshot, category_snapshot').in('id', ids);
  if (JSON.stringify(before.data) !== JSON.stringify(afterRegs.data)) {
    throw new Error('Snapshots ou inscrições mudaram na transição para checagem.');
  }
  const next: McSimR2Identity = { ...identity, status: 'checagem' };
  writeMcSimR2Identity(next);
  const list = await officialList();
  const athleteA = list.find((row) => row.id === identity.registrationIds.a);
  if (!athleteA?.isAloneInCategory || athleteA.categoryName !== LEVE_NAME) {
    throw new Error('Atleta A precisa estar sozinho no Leve ao abrir a checagem.');
  }
  return { stage: 'checking', reused, identity: next, list, snapshotsIntact: true };
}

async function listTargets(actor: Awaited<ReturnType<typeof clients>>['actor'], registrationId: string, medioId: string) {
  const eligible = await actor.rpc('list_eligible_category_changes', { target_registration_id: registrationId });
  if (eligible.error) throw new Error(`elegibilidade: ${eligible.error.message}`);
  const targets = eligible.data || [];
  if (!targets.some((row) => row.id === medioId)) {
    throw new Error(`Médio adjacente não apareceu. Destinos: ${targets.map((row) => row.nome).join(', ') || 'nenhum'}`);
  }
  return targets;
}

export async function ensureRequest() {
  const { admin, actor, identity, event } = await clients();
  if (event.status !== 'checagem') throw new Error('r2 precisa estar em checagem.');
  if (identity.rejectedRequestId) {
    return { stage: 'request', skipped: true, reason: 'Primeira solicitação já recusada.', identity };
  }
  if (identity.changeRequestId) {
    const existing = await admin.from('category_change_requests').select('*').eq('id', identity.changeRequestId).maybeSingle();
    if (existing.data) return { stage: 'request', reused: true, identity, request: existing.data };
  }
  const targets = await listTargets(actor, identity.registrationIds.a, identity.categoryIds.medio);
  const requested = await actor.rpc('request_category_change', {
    target_registration_id: identity.registrationIds.a,
    requested_category_id: identity.categoryIds.medio,
    reason_text: REQUEST_REASON,
  });
  const payload = jsonKind(must('solicitação', requested.error, requested.data));
  if (payload.kind !== 'requested') throw new Error('Solicitação não retornou kind=requested.');
  const requestId = String(payload.requestId);
  const duplicate = await actor.rpc('request_category_change', {
    target_registration_id: identity.registrationIds.a,
    requested_category_id: identity.categoryIds.medio,
    reason_text: 'segunda tentativa deve falhar',
  });
  const next: McSimR2Identity = { ...identity, changeRequestId: requestId };
  writeMcSimR2Identity(next);
  const stored = await admin.from('category_change_requests').select('*').eq('id', requestId).single();
  const registration = await admin.from('registrations').select('id, category_id, current_category_id, athlete_snapshot, category_snapshot').eq('id', identity.registrationIds.a).single();
  return {
    stage: 'request',
    reused: false,
    identity: next,
    targets,
    request: stored.data,
    registration: registration.data,
    secondRequestError: duplicate.error?.message || null,
  };
}

export async function ensureReject() {
  const { admin, actor, identity, event } = await clients();
  if (event.status !== 'checagem') throw new Error('r2 precisa estar em checagem.');
  if (!identity.changeRequestId) throw new Error('Solicitação r2 ausente. Rode npm run mc-sim:r2:request.');
  if (identity.rejectedRequestId === identity.changeRequestId) {
    return { stage: 'reject', reused: true, identity };
  }
  const before = await admin.from('registrations').select('id, category_id, current_category_id, athlete_snapshot, category_snapshot').eq('id', identity.registrationIds.a).single();
  const reviewed = await actor.rpc('review_category_change', {
    target_request_id: identity.changeRequestId,
    approve_request: false,
  });
  const payload = jsonKind(must('recusa', reviewed.error, reviewed.data));
  if (payload.status !== 'recusada') throw new Error('Recusa não retornou status recusada.');
  const after = await admin.from('registrations').select('id, category_id, current_category_id, athlete_snapshot, category_snapshot').eq('id', identity.registrationIds.a).single();
  if (after.data?.current_category_id) throw new Error('Recusa alterou current_category_id.');
  if (after.data?.category_id !== identity.categoryIds.leve) throw new Error('category_id original mudou na recusa.');
  if (JSON.stringify(before.data?.athlete_snapshot) !== JSON.stringify(after.data?.athlete_snapshot)
    || JSON.stringify(before.data?.category_snapshot) !== JSON.stringify(after.data?.category_snapshot)) {
    throw new Error('Snapshot mudou na recusa.');
  }
  const next: McSimR2Identity = {
    ...identity,
    rejectedRequestId: identity.changeRequestId,
    changeRequestId: null,
  };
  writeMcSimR2Identity(next);
  return { stage: 'reject', reused: false, identity: next, result: payload, before: before.data, after: after.data };
}

export async function ensureRequestAgain() {
  const { admin, actor, identity, event } = await clients();
  if (event.status !== 'checagem') throw new Error('r2 precisa estar em checagem.');
  if (!identity.rejectedRequestId) throw new Error('Recusa ainda não ocorreu. Rode npm run mc-sim:r2:reject.');
  if (identity.approvedRequestId) return { stage: 'request-again', skipped: true, reason: 'Já aprovado.', identity };
  if (identity.changeRequestId) {
    const existing = await admin.from('category_change_requests').select('*').eq('id', identity.changeRequestId).maybeSingle();
    if (existing.data?.status === 'pendente') return { stage: 'request-again', reused: true, identity, request: existing.data };
  }
  const targets = await listTargets(actor, identity.registrationIds.a, identity.categoryIds.medio);
  const requested = await actor.rpc('request_category_change', {
    target_registration_id: identity.registrationIds.a,
    requested_category_id: identity.categoryIds.medio,
    reason_text: `${REQUEST_REASON} Segunda solicitação após recusa.`,
  });
  const payload = jsonKind(must('nova solicitação', requested.error, requested.data));
  const requestId = String(payload.requestId);
  const next: McSimR2Identity = { ...identity, changeRequestId: requestId };
  writeMcSimR2Identity(next);
  const stored = await admin.from('category_change_requests').select('*').eq('id', requestId).single();
  return { stage: 'request-again', reused: false, identity: next, targets, request: stored.data };
}

export async function ensureApprove() {
  const { admin, actor, identity, event } = await clients();
  if (event.status !== 'checagem') throw new Error('r2 precisa estar em checagem.');
  if (!identity.changeRequestId) throw new Error('Nova solicitação ausente. Rode npm run mc-sim:r2:request-again.');
  if (identity.approvedRequestId === identity.changeRequestId) {
    return { stage: 'approve', reused: true, identity, list: await officialList() };
  }
  const before = await admin.from('registrations').select('id, category_id, current_category_id, athlete_snapshot, category_snapshot').eq('id', identity.registrationIds.a).single();
  const athleteSnapshot = before.data?.athlete_snapshot;
  const categorySnapshot = before.data?.category_snapshot;
  const reviewed = await actor.rpc('review_category_change', {
    target_request_id: identity.changeRequestId,
    approve_request: true,
  });
  const payload = jsonKind(must('aprovação', reviewed.error, reviewed.data));
  if (payload.status !== 'aprovada') throw new Error('Aprovação não retornou status aprovada.');
  const second = await actor.rpc('review_category_change', {
    target_request_id: identity.changeRequestId,
    approve_request: true,
  });
  const after = await admin.from('registrations').select('id, category_id, current_category_id, athlete_snapshot, category_snapshot').eq('id', identity.registrationIds.a).single();
  if (after.data?.current_category_id !== identity.categoryIds.medio) {
    throw new Error('current_category_id não ficou no Médio.');
  }
  if (after.data?.category_id !== identity.categoryIds.leve) {
    throw new Error('category_id original não permaneceu no Leve.');
  }
  if (JSON.stringify(after.data?.athlete_snapshot) !== JSON.stringify(athleteSnapshot)
    || JSON.stringify(after.data?.category_snapshot) !== JSON.stringify(categorySnapshot)) {
    throw new Error('Snapshot mudou na aprovação.');
  }
  const list = await officialList();
  const athleteA = list.find((row) => row.id === identity.registrationIds.a);
  if (athleteA?.categoryName !== MEDIO_NAME || athleteA.isAloneInCategory) {
    throw new Error('Lista não agrupou Atleta A no Médio com adversários.');
  }
  const next: McSimR2Identity = { ...identity, approvedRequestId: identity.changeRequestId };
  writeMcSimR2Identity(next);
  return {
    stage: 'approve',
    reused: false,
    identity: next,
    result: payload,
    before: before.data,
    after: after.data,
    secondReviewError: second.error?.message || null,
    list,
  };
}

export async function ensureLock() {
  const { admin, actor, identity, event } = await clients();
  if (event.status !== 'checagem') throw new Error('r2 precisa estar em checagem.');
  if (!identity.approvedRequestId) throw new Error('Aprovação ausente. Rode npm run mc-sim:r2:approve.');
  if (event.checagem_travada_em) {
    const second = await actor.rpc('lock_event_checagem', { target_event_id: event.id });
    const requestAfterLock = await actor.rpc('request_category_change', {
      target_registration_id: identity.registrationIds.a,
      requested_category_id: identity.categoryIds.medio,
      reason_text: 'tentativa após travamento r2',
    });
    const next: McSimR2Identity = { ...identity, checagemLockedAt: event.checagem_travada_em, status: 'checagem' };
    writeMcSimR2Identity(next);
    return {
      stage: 'lock',
      reused: true,
      identity: next,
      lockedAt: event.checagem_travada_em,
      secondLockError: second.error?.message || null,
      requestAfterLockError: requestAfterLock.error?.message || null,
    };
  }
  const pending = await admin.from('category_change_requests').select('id').eq('status', 'pendente').in('registration_id', Object.values(identity.registrationIds));
  if ((pending.data || []).length) throw new Error('Há solicitação pendente. Decida antes de travar.');
  const locked = await actor.rpc('lock_event_checagem', { target_event_id: event.id });
  const payload = jsonKind(must('travamento', locked.error, locked.data));
  const second = await actor.rpc('lock_event_checagem', { target_event_id: event.id });
  const after = await admin.from('events').select('id, status, checagem_travada_em').eq('id', event.id).single();
  const requestAfterLock = await actor.rpc('request_category_change', {
    target_registration_id: identity.registrationIds.a,
    requested_category_id: identity.categoryIds.medio,
    reason_text: 'tentativa após travamento r2',
  });
  const next: McSimR2Identity = { ...identity, status: 'checagem', checagemLockedAt: after.data?.checagem_travada_em || null };
  writeMcSimR2Identity(next);
  return {
    stage: 'lock',
    reused: false,
    identity: next,
    result: payload,
    lockedAt: after.data?.checagem_travada_em,
    secondLockError: second.error?.message || null,
    requestAfterLockError: requestAfterLock.error?.message || null,
  };
}

export async function runStage(stage: string) {
  loadCleanupEnv();
  requireE2eWrites('MC-SIM r2 runbook');
  if (stage === 'participants') return ensureParticipants();
  if (stage === 'registrations') return ensureRegistrations();
  if (stage === 'settle') return ensureSettlement();
  if (stage === 'checking') return ensureChecking();
  if (stage === 'request') return ensureRequest();
  if (stage === 'reject') return ensureReject();
  if (stage === 'request-again') return ensureRequestAgain();
  if (stage === 'approve') return ensureApprove();
  if (stage === 'lock') return ensureLock();
  throw new Error('Use participants | registrations | settle | checking | request | reject | request-again | approve | lock');
}
