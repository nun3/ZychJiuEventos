import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { createCleanupClients, loadCleanupEnv, resolveOwnerId } from '../tests/support/e2e-cleanup';

const EVENT_NAME = 'MC-SIM — Competição canônica';
const RULE_NAME = 'MC-SIM Regras iniciais';
const CATEGORY_NAME = 'MC-SIM Adulto Leve';

async function main() {
  loadCleanupEnv();
  const baseURL = process.env.BASE_URL || 'http://localhost:3000';
  const email = process.env.E2E_OWNER_EMAIL || '';
  const password = process.env.E2E_OWNER_PASSWORD || '';
  if (!email || !password) throw new Error('E2E_OWNER_EMAIL/PASSWORD ausentes.');

  const { admin, actor } = await createCleanupClients();
  const ownerUserId = await resolveOwnerId(actor);
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

  const existing = await admin.from('events').select('id, nome, status, organization_id').eq('nome', EVENT_NAME).maybeSingle();
  if (process.argv.includes('--owner-session')) {
    const identity = existing.data?.id
      ? {
          eventId: existing.data.id,
          eventName: existing.data.nome,
          organizationId: existing.data.organization_id,
          organizationName: orgName,
          status: existing.data.status,
          reused: true,
          createdVia: 'reused',
        }
      : await createViaOwnerSession(actor, admin, ownerUserId, membership.organization_id, orgName || '');
    writeIdentity(identity);
    console.log(JSON.stringify(identity, null, 2));
    return;
  }
  if (existing.data?.id) {
    const identity = {
      eventId: existing.data.id,
      eventName: existing.data.nome,
      organizationId: existing.data.organization_id,
      status: existing.data.status,
      reused: true,
    };
    writeIdentity(identity);
    console.log(JSON.stringify(identity, null, 2));
    return;
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ baseURL });
  try {
    await page.goto('/login?redirectTo=%2Fadmin%2Feventos%2Fnovo');
    await page.getByRole('button', { name: 'Entrar na conta', exact: true }).waitFor({ state: 'visible' });
    await page.getByRole('button', { name: 'Entrar na conta', exact: true }).waitFor({ state: 'attached' });
    await page.waitForTimeout(300);
    await page.locator('#login-email').fill(email);
    await page.locator('#login-password').fill(password);
    await page.getByRole('button', { name: 'Entrar na conta', exact: true }).click();
    await page.waitForURL(/\/admin\/eventos\/novo/);
    await page.getByLabel('Nome do evento').fill(EVENT_NAME);
    await page.getByLabel('Data do evento').fill('2027-12-20');
    await page.getByLabel('Local').fill('Ginásio MC-SIM');
    await fillPhase(page, 'Inscrição', '2027-10-01T08:00', '2027-10-31T23:00');
    await fillPhase(page, 'Pagamento', '2027-11-01T08:00', '2027-11-10T23:00');
    await fillPhase(page, 'Checagem', '2027-11-11T08:00', '2027-11-20T23:00');
    await fillPhase(page, 'Chaves', '2027-11-21T08:00', '2027-12-01T23:00');
    await page.getByRole('button', { name: 'Publicar', exact: true }).click();
    await page.waitForURL(/\/admin\/eventos$/);

    const created = await admin.from('events').select('id, nome, status, organization_id').eq('nome', EVENT_NAME).single();
    if (created.error || !created.data) throw new Error(created.error?.message || 'Evento MC-SIM não encontrado após publicar.');

    await page.goto(`/admin/eventos/${created.data.id}/configuracao`);
    await page.getByLabel('Nome do conjunto').fill(RULE_NAME);
    await page.getByLabel('Nome da categoria').fill(CATEGORY_NAME);
    await page.getByRole('button', { name: 'Criar versão' }).click();
    await page.getByText(CATEGORY_NAME).waitFor();

    const rule = await admin.from('category_rule_sets').select('id').eq('event_id', created.data.id).single();
    const category = await admin.from('event_categories').select('id, nome').eq('rule_set_id', rule.data?.id || '').maybeSingle();

    const identity = {
      eventId: created.data.id,
      eventName: created.data.nome,
      organizationId: created.data.organization_id,
      organizationName: orgName,
      status: created.data.status,
      ruleSetId: rule.data?.id || null,
      categoryId: category.data?.id || null,
      categoryName: category.data?.nome || CATEGORY_NAME,
      reused: false,
    };
    writeIdentity(identity);
    console.log(JSON.stringify(identity, null, 2));
  } finally {
    await browser.close();
  }
}

function zonedLocalToUtc(value: string, timeZone: string) {
  const assumedUtc = new Date(`${value}:00.000Z`);
  const partsAt = (date: Date) => {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    }).formatToParts(date);
    const mapped = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return Date.UTC(Number(mapped.year), Number(mapped.month) - 1, Number(mapped.day), Number(mapped.hour), Number(mapped.minute), Number(mapped.second));
  };
  const firstOffset = partsAt(assumedUtc) - assumedUtc.getTime();
  const firstResult = new Date(assumedUtc.getTime() - firstOffset);
  const finalOffset = partsAt(firstResult) - firstResult.getTime();
  return new Date(assumedUtc.getTime() - finalOffset).toISOString();
}

async function createViaOwnerSession(
  actor: Awaited<ReturnType<typeof createCleanupClients>>['actor'],
  admin: Awaited<ReturnType<typeof createCleanupClients>>['admin'],
  ownerUserId: string,
  organizationId: string,
  organizationName: string,
) {
  const timezone = 'America/Sao_Paulo';
  const slug = `mc-sim-competicao-canonica-${Date.now().toString(36)}`;
  const phases = [
    { tipo: 'inscricao' as const, inicio: '2027-10-01T08:00', fim: '2027-10-31T23:00' },
    { tipo: 'pagamento' as const, inicio: '2027-11-01T08:00', fim: '2027-11-10T23:00' },
    { tipo: 'checagem' as const, inicio: '2027-11-11T08:00', fim: '2027-11-20T23:00' },
    { tipo: 'chaves' as const, inicio: '2027-11-21T08:00', fim: '2027-12-01T23:00' },
  ].map((phase) => ({ ...phase, inicio: zonedLocalToUtc(phase.inicio, timezone), fim: zonedLocalToUtc(phase.fim, timezone) }));

  const inserted = await actor.from('events').insert({
    organization_id: organizationId,
    nome: EVENT_NAME,
    slug,
    data_evento: '2027-12-20',
    timezone,
    local: 'Ginásio MC-SIM',
    informacoes: 'Competição canônica MC-SIM. Evolui por sprints; não apagar no teardown de cenário.',
    valor_inscricao: 0,
    created_by: ownerUserId,
    status: 'rascunho',
  }).select('id, nome, status, organization_id').single();
  if (inserted.error || !inserted.data) throw new Error(inserted.error?.message || 'Falha ao criar evento MC-SIM.');

  const phasesInsert = await actor.from('event_phases').insert(
    phases.map(({ tipo, inicio, fim }) => ({ event_id: inserted.data.id, tipo, inicio, fim })),
  );
  if (phasesInsert.error) {
    await admin.from('events').delete().eq('id', inserted.data.id);
    throw new Error(phasesInsert.error.message);
  }
  const published = await actor.from('events').update({ status: 'publicado' }).eq('id', inserted.data.id).select('id, nome, status, organization_id').single();
  if (published.error || !published.data) throw new Error(published.error?.message || 'Falha ao publicar MC-SIM.');

  const rule = await actor.from('category_rule_sets').insert({
    event_id: published.data.id, nome: RULE_NAME, versao: 1, ativo: false,
  }).select('id').single();
  if (rule.error || !rule.data) throw new Error(rule.error?.message || 'Falha ao criar rule set.');
  const category = await actor.from('event_categories').insert({
    rule_set_id: rule.data.id,
    nome: CATEGORY_NAME,
    idade_min: 18,
    idade_max: 29,
    faixa_min_ordem: 1,
    faixa_max_ordem: 1,
    peso_min_kg: 0,
    peso_max_kg: 76,
    genero: 'M',
    ordem: 1,
  }).select('id, nome').single();
  if (category.error) {
    await admin.from('category_rule_sets').delete().eq('id', rule.data.id);
    throw new Error(category.error.message);
  }
  await actor.from('category_rule_sets').update({ ativo: true }).eq('id', rule.data.id);

  return {
    eventId: published.data.id,
    eventName: published.data.nome,
    organizationId: published.data.organization_id,
    organizationName,
    status: published.data.status,
    ruleSetId: rule.data.id,
    categoryId: category.data?.id || null,
    categoryName: category.data?.nome || CATEGORY_NAME,
    reused: false,
    createdVia: 'owner-session',
  };
}

async function fillPhase(page: import('@playwright/test').Page, label: string, start: string, end: string) {
  const group = page.getByText(label, { exact: true }).locator('..');
  await group.getByLabel('Início').fill(start);
  await group.getByLabel('Término').fill(end);
}

function writeIdentity(identity: Record<string, unknown>) {
  const file = path.resolve(__dirname, '../tests/support/mc-sim.identity.json');
  writeFileSync(file, `${JSON.stringify(identity, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
