import { createCleanupClients, resolveOwnerId } from './e2e-cleanup';
import { loadMcSimIdentity, writeMcSimIdentity, type McSimIdentity } from './mc-sim';

const TEAM_ALFA = 'MC-SIM Equipe Alfa';
const TEAM_BETA = 'MC-SIM Equipe Beta';
const MEDIO_NAME = 'MC-SIM Adulto Médio';
const FEE = 80;
const TERMS = 'MVP-2026-09';
const SETTLE_REASON = 'Baixa controlada do runbook MC-SIM no Sandbox, sem emissão Asaas Live.';

const ATHLETES = [
  { nome: 'MC-SIM Atleta 1', team: 'alfa' as const, nascimento: '2002-03-15', peso: 70, faixa: 'Branca', genero: 'M' },
  { nome: 'MC-SIM Atleta 2', team: 'alfa' as const, nascimento: '2001-08-20', peso: 70, faixa: 'Branca', genero: 'M' },
  { nome: 'MC-SIM Atleta 3', team: 'beta' as const, nascimento: '2000-01-10', peso: 72, faixa: 'Branca', genero: 'M' },
  { nome: 'MC-SIM Atleta 4', team: 'alfa' as const, nascimento: '1999-06-01', peso: 82, faixa: 'Branca', genero: 'M' },
] as const;

function must<T>(label: string, error: { message: string } | null, data: T | null | undefined): T {
  if (error || data == null) throw new Error(`${label}: ${error?.message || 'sem dados'}`);
  return data;
}

function hoursFromNow(hours: number) {
  return new Date(Date.now() + hours * 3600_000).toISOString();
}

async function clients() {
  const { admin, actor } = await createCleanupClients();
  const ownerUserId = await resolveOwnerId(actor);
  const identity = loadMcSimIdentity();
  const loaded = await admin.from('events').select('id, nome, status, organization_id, valor_inscricao, data_evento').eq('id', identity.eventId).single();
  const event = must('MC-SIM', loaded.error, loaded.data);
  return { admin, actor, identity, event, ownerUserId };
}

export async function ensureParticipants() {
  const { admin, actor, identity, event, ownerUserId } = await clients();
  const orgId = event.organization_id;
  const next: McSimIdentity = { ...identity, organizationId: orgId };

  async function teamBy(id: string | undefined, nome: string) {
    if (id) {
      const known = await admin.from('teams').select('id, nome').eq('id', id).maybeSingle();
      if (known.data?.id) return known.data;
    }
    const named = await admin.from('teams').select('id, nome').eq('organization_id', orgId).eq('nome', nome).maybeSingle();
    if (named.data?.id) return named.data;
    const created = await actor.from('teams').insert({ nome, organization_id: orgId, created_by: ownerUserId }).select('id, nome').single();
    return must(`equipe ${nome}`, created.error, created.data);
  }

  const alfa = await teamBy(next.teamIds?.alfa, TEAM_ALFA);
  const beta = await teamBy(next.teamIds?.beta, TEAM_BETA);
  next.teamIds = { alfa: alfa.id, beta: beta.id };

  const athleteIds: string[] = [];
  for (let index = 0; index < ATHLETES.length; index += 1) {
    const spec = ATHLETES[index];
    const knownId = next.athleteIds?.[index];
    if (knownId) {
      const known = await admin.from('athletes').select('id').eq('id', knownId).maybeSingle();
      if (known.data?.id) {
        athleteIds.push(known.data.id);
        continue;
      }
    }
    const named = await admin.from('athletes').select('id').eq('organization_id', orgId).eq('nome_completo', spec.nome).maybeSingle();
    if (named.data?.id) {
      athleteIds.push(named.data.id);
      continue;
    }
    const created = await actor.rpc('create_managed_athlete', {
      target_team_id: spec.team === 'alfa' ? alfa.id : beta.id,
      athlete_name: spec.nome,
      athlete_birth_date: spec.nascimento,
      athlete_gender: spec.genero,
      athlete_belt: spec.faixa,
      athlete_weight: spec.peso,
      relationship: 'professor',
    });
    athleteIds.push(must(`atleta ${spec.nome}`, created.error, created.data));
  }
  next.athleteIds = athleteIds;

  const ruleId = next.ruleSetId;
  if (!ruleId || !next.categoryId) throw new Error('MC-SIM sem rule set/categoria leve.');
  const medioKnown = await admin.from('event_categories').select('id').eq('rule_set_id', ruleId).eq('nome', MEDIO_NAME).maybeSingle();
  let medioId = medioKnown.data?.id;
  if (!medioId) {
    const created = await actor.from('event_categories').insert({
      rule_set_id: ruleId,
      nome: MEDIO_NAME,
      idade_min: 18,
      idade_max: 29,
      faixa_min_ordem: 1,
      faixa_max_ordem: 1,
      peso_min_kg: 76.01,
      peso_max_kg: 88,
      genero: 'M',
      ordem: 2,
    }).select('id').single();
    medioId = must('categoria médio', created.error, created.data).id;
  }
  next.categoryIds = { leve: next.categoryId, medio: medioId };

  writeMcSimIdentity(next);
  return { stage: 'participants', identity: next };
}

export async function ensureRegistrations() {
  const { admin, actor, identity, event } = await clients();
  if (identity.registrationIds?.length) {
    const existing = await admin.from('registrations').select('id, status, athlete_id, category_id, valor, athlete_snapshot, category_snapshot, numero').in('id', identity.registrationIds);
    if ((existing.data || []).length === identity.registrationIds.length) {
      return { stage: 'registrations', reused: true, identity, registrations: existing.data };
    }
  }
  if (!identity.athleteIds?.length) throw new Error('Participantes MC-SIM ausentes. Rode npm run mc-sim:participants.');

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
    throw new Error(`MC-SIM em ${event.status}; inscrições exigem publicado ou inscricao.`);
  }

  const created = await actor.rpc('create_event_registrations', {
    target_event_id: event.id,
    target_athlete_ids: identity.athleteIds,
    accepted_terms_version: TERMS,
    terms_accepted: true,
  });
  const rows = must('inscrições', created.error, created.data);
  const next: McSimIdentity = {
    ...identity,
    status: 'inscricao',
    registrationIds: rows.map((row) => row.registration_id),
  };
  writeMcSimIdentity(next);
  const stored = await admin.from('registrations').select('id, status, athlete_id, category_id, valor, athlete_snapshot, category_snapshot, numero').in('id', next.registrationIds || []);
  return { stage: 'registrations', reused: false, identity: next, registrations: stored.data };
}

export async function ensureSettlement() {
  const { admin, actor, identity, event } = await clients();
  if (!identity.registrationIds?.length) throw new Error('Inscrições MC-SIM ausentes. Rode npm run mc-sim:registrations.');
  const loaded = await admin.from('registrations').select('id, status, athlete_id, category_id, valor, athlete_snapshot, category_snapshot').in('id', identity.registrationIds);
  const rows = loaded.data || [];
  if (rows.length !== identity.registrationIds.length) throw new Error('Inscrições da identidade não encontradas.');
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
    throw new Error(`MC-SIM em ${event.status}; reserva exige pagamento.`);
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

  const after = await admin.from('registrations').select('id, status, athlete_id, category_id, valor, athlete_snapshot, category_snapshot').in('id', identity.registrationIds);
  if ((after.data || []).some((row) => row.status !== 'efetivada')) {
    throw new Error('Nem todas as inscrições MC-SIM ficaram efetivadas.');
  }
  const next: McSimIdentity = { ...identity, status: 'pagamento', paymentId };
  writeMcSimIdentity(next);
  return { stage: 'settle', reused: false, identity: next, registrations: after.data, paymentId };
}

export async function runStage(stage: string) {
  if (stage === 'participants') return ensureParticipants();
  if (stage === 'registrations') return ensureRegistrations();
  if (stage === 'settle') return ensureSettlement();
  throw new Error('Use participants | registrations | settle');
}
