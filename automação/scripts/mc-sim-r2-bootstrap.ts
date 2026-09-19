import { createCleanupClients, loadCleanupEnv, resolveOwnerId } from '../tests/support/e2e-cleanup';
import { requireE2eWrites } from '../tests/support/e2e-writes';
import { loadMcSimIdentity } from '../tests/support/mc-sim';
import {
  MC_SIM_R2_EVENT_NAME,
  writeMcSimR2Identity,
  type McSimR2Identity,
} from '../tests/support/mc-sim-r2';

const RULE_NAME = 'MC-SIM r2 Regras';
const LEVE_NAME = 'MC-SIM r2 Adulto Leve';
const MEDIO_NAME = 'MC-SIM r2 Adulto Médio';
const FEE = 80;

async function main() {
  loadCleanupEnv();
  requireE2eWrites('MC-SIM r2 bootstrap');
  const { admin, actor } = await createCleanupClients();
  const ownerUserId = await resolveOwnerId(actor);
  const r1 = loadMcSimIdentity();
  if (!r1.eventId) throw new Error('MC-SIM r1 ausente; r2 não sobrescreve r1, mas precisa dele intacto.');

  const { data: membership, error: memberError } = await admin
    .from('organization_members')
    .select('organization_id, organizations(nome)')
    .eq('user_id', ownerUserId)
    .in('role', ['owner', 'organizer'])
    .limit(1)
    .maybeSingle();
  if (memberError || !membership) throw new Error('Owner sem organização permanente.');
  const org = membership.organizations as { nome: string } | { nome: string }[] | null;
  const orgName = Array.isArray(org) ? org[0]?.nome : org?.nome;
  if (!orgName || orgName === 'Checkout E2E' || orgName === 'Checagem E2E') {
    throw new Error('A organização corrente do owner não é a permanente.');
  }
  if (membership.organization_id !== r1.organizationId) {
    throw new Error('Owner não está na organização do MC-SIM r1.');
  }

  const existing = await admin.from('events').select('id, nome, status, organization_id').eq('nome', MC_SIM_R2_EVENT_NAME).maybeSingle();
  if (existing.data?.id) {
    if (existing.data.id === r1.eventId) throw new Error('Nome r2 colidiu com o evento r1.');
    const rule = await admin.from('category_rule_sets').select('id').eq('event_id', existing.data.id).eq('ativo', true).maybeSingle();
    const categories = await admin.from('event_categories').select('id, nome').eq('rule_set_id', rule.data?.id || '');
    const leve = (categories.data || []).find((row) => row.nome === LEVE_NAME);
    const medio = (categories.data || []).find((row) => row.nome === MEDIO_NAME);
    if (!rule.data?.id || !leve || !medio) throw new Error('Evento r2 existente sem Leve e Médio adjacentes.');
    const identity: McSimR2Identity = {
      revision: 'r2',
      eventId: existing.data.id,
      eventName: existing.data.nome,
      organizationId: existing.data.organization_id,
      organizationName: orgName,
      status: existing.data.status,
      ruleSetId: rule.data.id,
      categoryIds: { leve: leve.id, medio: medio.id },
      teamIds: { alfa: '', beta: '' },
      athleteIds: { a: '', b: '', c: '' },
      registrationIds: { a: '', b: '', c: '' },
      createdVia: 'reused',
    };
    writeMcSimR2Identity(identity);
    console.log(JSON.stringify({ ...identity, r1Untouched: r1.eventId }, null, 2));
    return;
  }

  const now = Date.now();
  const iso = (offsetMs: number) => new Date(now + offsetMs).toISOString();
  const inserted = await actor.from('events').insert({
    organization_id: membership.organization_id,
    nome: MC_SIM_R2_EVENT_NAME,
    slug: `mc-sim-r2-realocacao-${Date.now().toString(36)}`,
    data_evento: '2027-12-20',
    timezone: 'America/Sao_Paulo',
    local: 'Ginásio MC-SIM r2',
    informacoes: 'MC-SIM r2. Prova a realocação operacional da checagem. Não alterar o r1.',
    valor_inscricao: FEE,
    created_by: ownerUserId,
    status: 'rascunho',
  }).select('id, nome, status, organization_id').single();
  if (inserted.error || !inserted.data) throw new Error(inserted.error?.message || 'Falha ao criar evento r2.');
  if (inserted.data.id === r1.eventId) throw new Error('Bootstrap r2 tentou reutilizar o evento r1.');

  const phases = await actor.from('event_phases').insert([
    { event_id: inserted.data.id, tipo: 'inscricao', inicio: iso(-2 * 3600_000), fim: iso(14 * 24 * 3600_000) },
    { event_id: inserted.data.id, tipo: 'pagamento', inicio: iso(14 * 24 * 3600_000 + 60_000), fim: iso(20 * 24 * 3600_000) },
    { event_id: inserted.data.id, tipo: 'checagem', inicio: iso(20 * 24 * 3600_000 + 60_000), fim: iso(25 * 24 * 3600_000) },
    { event_id: inserted.data.id, tipo: 'chaves', inicio: iso(25 * 24 * 3600_000 + 60_000), fim: iso(30 * 24 * 3600_000) },
  ]);
  if (phases.error) {
    await admin.from('events').delete().eq('id', inserted.data.id);
    throw new Error(phases.error.message);
  }

  const published = await actor.from('events').update({ status: 'publicado' }).eq('id', inserted.data.id).select('id, nome, status, organization_id').single();
  if (published.error || !published.data) throw new Error(published.error?.message || 'Falha ao publicar r2.');

  const rule = await actor.from('category_rule_sets').insert({
    event_id: published.data.id, nome: RULE_NAME, versao: 1, ativo: false,
  }).select('id').single();
  if (rule.error || !rule.data) throw new Error(rule.error?.message || 'Falha ao criar rule set r2.');

  const leve = await actor.from('event_categories').insert({
    rule_set_id: rule.data.id,
    nome: LEVE_NAME,
    idade_min: 18,
    idade_max: 29,
    faixa_min_ordem: 1,
    faixa_max_ordem: 1,
    peso_min_kg: 0,
    peso_max_kg: 76,
    genero: 'M',
    ordem: 1,
  }).select('id, nome').single();
  const medio = await actor.from('event_categories').insert({
    rule_set_id: rule.data.id,
    nome: MEDIO_NAME,
    idade_min: 18,
    idade_max: 29,
    faixa_min_ordem: 1,
    faixa_max_ordem: 1,
    peso_min_kg: 76.01,
    peso_max_kg: 88,
    genero: 'M',
    ordem: 2,
  }).select('id, nome').single();
  if (leve.error || medio.error || !leve.data || !medio.data) {
    await admin.from('category_rule_sets').delete().eq('id', rule.data.id);
    throw new Error(leve.error?.message || medio.error?.message || 'Falha ao criar categorias r2.');
  }
  const activated = await actor.from('category_rule_sets').update({ ativo: true }).eq('id', rule.data.id);
  if (activated.error) throw new Error(activated.error.message);

  const identity: McSimR2Identity = {
    revision: 'r2',
    eventId: published.data.id,
    eventName: published.data.nome,
    organizationId: published.data.organization_id,
    organizationName: orgName,
    status: published.data.status,
    ruleSetId: rule.data.id,
    categoryIds: { leve: leve.data.id, medio: medio.data.id },
    teamIds: { alfa: '', beta: '' },
    athleteIds: { a: '', b: '', c: '' },
    registrationIds: { a: '', b: '', c: '' },
    createdVia: 'owner-session',
  };
  writeMcSimR2Identity(identity);
  console.log(JSON.stringify({ ...identity, r1EventId: r1.eventId, r1Untouched: true }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
