/**
 * Fixtures sintéticas para homologação num Supabase INDEPENDENTE de `zigjiu` (G4/G5 do lote de
 * prontidão operacional — docs/releases/EVENT-READINESS.md).
 *
 * Cria, no projeto apontado por HOMOLOG_SUPABASE_URL (nunca zigjiu — ver
 * tests/support/independent-homologation-guard.ts): uma organização sintética, N atletas
 * sintéticos distribuídos pelo catálogo oficial publicado nesse projeto, um evento com fases,
 * uma versão de categorias com TODAS as definições do catálogo (o caso "selecionar todas" do
 * G2), e inscreve os atletas via a RPC create_event_registrations — o mesmo caminho de produção.
 *
 * Por padrão roda em modo leitura (dry-run): só valida o schema do alvo e imprime o que faria.
 * Passe --execute para escrever de fato.
 *
 * Uso:
 *   cd automação
 *   HOMOLOG_SUPABASE_URL=... HOMOLOG_SUPABASE_SERVICE_ROLE_KEY=... HOMOLOG_ALLOW_WRITES=true \
 *     npx ts-node scripts/independent-homologation-fixtures.ts --execute --athletes=250 --concurrency=1
 *
 * Nunca lê nem usa NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY (zigjiu) — só as variáveis
 * HOMOLOG_*, carregadas de automação/.env.homologation (arquivo local, não versionado; ver
 * automação/.env.homologation.example).
 */

import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  assertIndependentHomologationEnvironment,
  buildIndependentHomologationRunId,
} from '../tests/support/independent-homologation-guard';
import { expandCatalogSelectionToCategoryRows, type CatalogCategoryDefinition } from '../../lib/events/catalog-category-sync';

type CliOptions = { execute: boolean; athleteCount: number; concurrency: number };

function parseArgs(argv: string[]): CliOptions {
  const flag = (name: string, fallback: string) => {
    const match = argv.find((arg) => arg.startsWith(`--${name}=`));
    return match ? match.split('=')[1] : fallback;
  };
  const athleteCount = Number(flag('athletes', '50'));
  const concurrency = Number(flag('concurrency', '1'));
  if (!Number.isInteger(athleteCount) || athleteCount <= 0 || athleteCount > 2000) {
    throw new Error('--athletes deve ser um inteiro entre 1 e 2000.');
  }
  if (!Number.isInteger(concurrency) || concurrency <= 0 || concurrency > athleteCount) {
    throw new Error('--concurrency deve ser um inteiro entre 1 e --athletes.');
  }
  return { execute: argv.includes('--execute'), athleteCount, concurrency };
}

function loadHomologEnvFile() {
  const file = path.resolve(__dirname, '../.env.homologation');
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const normalized = line.trim();
    if (!normalized || normalized.startsWith('#') || !normalized.includes('=')) continue;
    const separator = normalized.indexOf('=');
    const key = normalized.slice(0, separator).trim();
    const value = normalized.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

const FIRST_NAMES = ['Ana', 'Bruno', 'Carla', 'Diego', 'Elisa', 'Felipe', 'Gabriela', 'Hugo', 'Isabela', 'João', 'Karina', 'Lucas', 'Marina', 'Nicolas', 'Olivia', 'Pedro', 'Quésia', 'Rafael', 'Sofia', 'Tiago'];
const LAST_NAMES = ['Almeida', 'Barbosa', 'Costa', 'Dias', 'Esteves', 'Ferreira', 'Gomes', 'Henriques', 'Ibrahim', 'Jardim', 'Lima', 'Martins', 'Nogueira', 'Oliveira', 'Pereira', 'Queiroz', 'Ramos', 'Souza', 'Teixeira', 'Vieira'];
const BELT_NAMES = ['branca', 'cinza', 'amarela', 'laranja', 'verde', 'azul', 'roxa', 'marrom', 'preta'];

function syntheticName(index: number) {
  const first = FIRST_NAMES[index % FIRST_NAMES.length];
  const last = LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length];
  return `MC-HOMOLOG Atleta ${String(index + 1).padStart(4, '0')} ${first} ${last}`;
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function birthDateForAge(age: number, eventDate: Date) {
  const birth = new Date(eventDate);
  birth.setFullYear(birth.getFullYear() - age);
  birth.setMonth(Math.floor(Math.random() * 12));
  birth.setDate(1 + Math.floor(Math.random() * 27));
  return birth.toISOString().slice(0, 10);
}

/** Gera um atleta sintético plausível dentro dos limites de UMA definição do catálogo. */
function syntheticAthleteFor(definition: CatalogCategoryDefinition, index: number, eventDate: Date) {
  const genero = definition.genero === 'U' ? (index % 2 === 0 ? 'M' : 'F') : definition.genero as 'M' | 'F';
  const ageSpan = definition.idade_max == null ? 3 : definition.idade_max - definition.idade_min;
  const age = definition.idade_min + Math.floor(randomBetween(0, Math.max(ageSpan, 0) + 1));
  const beltIndex = definition.faixa_min_ordem - 1 + Math.floor(randomBetween(0, definition.faixa_max_ordem - definition.faixa_min_ordem + 1));
  const pesoMax = definition.peso_max_kg ?? definition.peso_min_kg + 10;
  const peso = Math.round(randomBetween(Number(definition.peso_min_kg) + 0.1, Number(pesoMax)) * 100) / 100;
  return {
    nome_completo: syntheticName(index),
    genero,
    data_nascimento: birthDateForAge(age, eventDate),
    faixa: BELT_NAMES[Math.min(Math.max(beltIndex, 0), BELT_NAMES.length - 1)],
    peso_kg: peso,
  };
}

async function main() {
  loadHomologEnvFile();
  const options = parseArgs(process.argv.slice(2));
  const env = assertIndependentHomologationEnvironment(process.env);
  const runId = buildIndependentHomologationRunId();

  console.log(`[${runId}] Alvo: ${env.host} · modo: ${options.execute ? 'EXECUTE' : 'DRY-RUN'} · atletas: ${options.athleteCount} · concorrência: ${options.concurrency}`);

  const admin = createClient(env.supabaseUrl, env.serviceRoleKey, { auth: { persistSession: false } });

  const { data: catalog, error: catalogError } = await admin
    .from('sport_category_catalogs')
    .select('id, nome, versao, sport_category_definitions(id, codigo, nome, divisao_etaria, idade_min, idade_max, genero, faixa_min_ordem, faixa_max_ordem, peso_min_kg, peso_max_kg, ordem)')
    .eq('sport', 'jiu-jitsu')
    .eq('modality', 'gi')
    .not('publicado_em', 'is', null)
    .order('versao', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (catalogError || !catalog || !catalog.sport_category_definitions?.length) {
    throw new Error(
      'Catálogo GI publicado não encontrado no alvo. Aplique o schema e o seed do catálogo ' +
      '(ver docs/releases/EVENT-READINESS.md § Homologação independente) antes de rodar este script. ' +
      `Detalhe: ${catalogError?.message || 'nenhum catálogo publicado'}`,
    );
  }
  const definitions = [...catalog.sport_category_definitions].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)) as CatalogCategoryDefinition[];
  console.log(`[${runId}] Catálogo: ${catalog.nome} v${catalog.versao} · ${definitions.length} definições.`);

  const eventDate = new Date();
  eventDate.setDate(eventDate.getDate() + 30);
  const athletes = Array.from({ length: options.athleteCount }, (_, index) =>
    syntheticAthleteFor(definitions[index % definitions.length], index, eventDate));

  const expanded = expandCatalogSelectionToCategoryRows(definitions, {}, null);
  if (!expanded.ok) {
    throw new Error(
      `Catálogo do alvo tem divisão sem teto que este gerador não resolve automaticamente: ${expanded.message}. ` +
      'Rode com menos definições ou informe os tetos manualmente antes de prosseguir.',
    );
  }
  console.log(`[${runId}] Seleção "todas": ${expanded.rows.length} categorias efetivas a partir de ${definitions.length} definições.`);

  const plan = {
    runId,
    target: env.host,
    organization: `MC-HOMOLOG Organização ${runId}`,
    event: `MC-HOMOLOG Evento ${runId}`,
    athleteCount: athletes.length,
    effectiveCategoryCount: expanded.rows.length,
    sampleAthletes: athletes.slice(0, 3),
  };

  if (!options.execute) {
    console.log(`[${runId}] DRY-RUN — nada foi escrito. Plano:`);
    console.log(JSON.stringify(plan, null, 2));
    return;
  }

  // --- Execução real, só a partir daqui ---
  const ownerEmail = `homolog-owner-${runId.toLowerCase()}@example.invalid`;
  const { data: createdUser, error: userError } = await admin.auth.admin.createUser({
    email: ownerEmail,
    password: crypto.randomUUID(),
    email_confirm: true,
    user_metadata: { synthetic: true, run_id: runId },
  });
  if (userError || !createdUser.user) throw new Error(`Falha ao criar usuário sintético: ${userError?.message}`);
  const ownerId = createdUser.user.id;

  const { data: organization, error: orgError } = await admin.from('organizations').insert({
    nome: plan.organization,
    slug: `mc-homolog-${runId.toLowerCase()}`,
    created_by: ownerId,
  }).select('id').single();
  if (orgError || !organization) throw new Error(`Falha ao criar organização sintética: ${orgError?.message}`);

  const { error: memberError } = await admin.from('organization_members').insert({
    organization_id: organization.id,
    user_id: ownerId,
    role: 'owner',
  });
  if (memberError) throw new Error(`Falha ao vincular owner sintético: ${memberError.message}`);

  const { data: event, error: eventError } = await admin.from('events').insert({
    organization_id: organization.id,
    nome: plan.event,
    slug: `mc-homolog-evento-${runId.toLowerCase()}`,
    data_evento: eventDate.toISOString().slice(0, 10),
    local: 'Ginásio sintético de homologação',
    valor_inscricao: 0,
    created_by: ownerId,
    status: 'rascunho',
  }).select('id').single();
  if (eventError || !event) throw new Error(`Falha ao criar evento sintético: ${eventError.message}`);

  const phaseTypes = ['inscricao', 'pagamento', 'checagem', 'chaves'] as const;
  const phaseRows = phaseTypes.map((tipo, index) => {
    const inicio = new Date(eventDate);
    inicio.setDate(inicio.getDate() - (phaseTypes.length - index) * 2);
    const fim = new Date(inicio);
    fim.setDate(fim.getDate() + 1);
    return { event_id: event.id, tipo, inicio: inicio.toISOString(), fim: fim.toISOString() };
  });
  const { error: phasesError } = await admin.from('event_phases').insert(phaseRows);
  if (phasesError) throw new Error(`Falha ao gravar fases do evento sintético: ${phasesError.message}`);

  const { data: rule, error: ruleError } = await admin.from('category_rule_sets').insert({
    event_id: event.id,
    nome: `MC-HOMOLOG Catálogo completo ${runId}`,
    versao: 1,
    ativo: false,
    category_catalog_id: catalog.id,
  }).select('id').single();
  if (ruleError || !rule) throw new Error(`Falha ao criar versão de categorias: ${ruleError.message}`);

  const { error: categoriesError } = await admin.from('event_categories').insert(
    expanded.rows.map((row) => ({ rule_set_id: rule.id, ...row })),
  );
  if (categoriesError) {
    await admin.from('category_rule_sets').delete().eq('id', rule.id);
    throw new Error(`Falha ao inserir o lote de categorias (${expanded.rows.length} linhas): ${categoriesError.message}`);
  }
  await admin.from('category_rule_sets').update({ ativo: true }).eq('id', rule.id);
  console.log(`[${runId}] Versão de categorias ativa: ${expanded.rows.length} categorias efetivas.`);

  const { data: insertedAthletes, error: athletesError } = await admin.from('athletes').insert(
    athletes.map((athlete) => ({ ...athlete, organization_id: organization.id, user_id: null })),
  ).select('id');
  if (athletesError || !insertedAthletes) throw new Error(`Falha ao inserir atletas sintéticos: ${athletesError?.message}`);
  console.log(`[${runId}] ${insertedAthletes.length} atletas sintéticos inseridos.`);

  // Inscrição via a RPC de produção, em lotes de concorrência configurável — observa o
  // comportamento real sob carga progressiva, sem simular nem supor o resultado.
  const athleteIds = insertedAthletes.map((row) => row.id as string);
  const batches: string[][] = [];
  for (let start = 0; start < athleteIds.length; start += options.concurrency) {
    batches.push(athleteIds.slice(start, start + options.concurrency));
  }

  const results: Array<{ athleteId: string; ok: boolean; message?: string; durationMs: number }> = [];
  for (const batch of batches) {
    const batchResults = await Promise.allSettled(batch.map(async (athleteId) => {
      const startedAt = Date.now();
      const { error } = await admin.rpc('create_event_registrations', {
        target_event_id: event.id,
        target_athlete_ids: [athleteId],
        accepted_terms_version: 'homolog-fixture-v1',
        terms_accepted: true,
      });
      return { athleteId, ok: !error, message: error?.message, durationMs: Date.now() - startedAt };
    }));
    for (const settled of batchResults) {
      results.push(settled.status === 'fulfilled'
        ? settled.value
        : { athleteId: 'desconhecido', ok: false, message: String(settled.reason), durationMs: 0 });
    }
  }

  const succeeded = results.filter((result) => result.ok).length;
  const report = {
    runId,
    target: env.host,
    event: { id: event.id, nome: plan.event },
    organization: { id: organization.id, nome: plan.organization },
    athleteCount: athletes.length,
    effectiveCategoryCount: expanded.rows.length,
    concurrency: options.concurrency,
    registrations: { attempted: results.length, succeeded, failed: results.length - succeeded },
    failures: results.filter((result) => !result.ok).slice(0, 50),
  };
  const reportPath = path.resolve(__dirname, `../../docs/releases/evidencias/homologation-${runId}.json`);
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`[${runId}] Inscrições: ${succeeded}/${results.length} com sucesso. Relatório: ${reportPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
