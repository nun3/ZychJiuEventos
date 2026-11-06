/**
 * Fixtures sintéticas para homologação no Supabase LOCAL (Docker, `supabase start`) — missão de
 * prontidão operacional de 6 nov 2026 (docs/releases/EVENT-READINESS.md).
 *
 * Variante de `independent-homologation-fixtures.ts` apontada para o stack local em vez de um
 * projeto remoto descartável: usa `local-homologation-guard.ts`, que só aceita
 * `NEXT_PUBLIC_SUPABASE_URL` resolvendo para 127.0.0.1/localhost e recusa qualquer host
 * `*.supabase.co` (produção/zigjiu incluído).
 *
 * Cria uma organização sintética, N atletas sintéticos distribuídos pelo catálogo oficial
 * publicado no stack local, um evento com fases, uma versão de categorias com TODAS as
 * definições do catálogo (caso "selecionar todas"), e inscreve os atletas via a RPC
 * `create_event_registrations` — o mesmo caminho de produção — em lotes de concorrência
 * configurável.
 *
 * Por padrão roda em modo leitura (dry-run). Passe --execute para escrever de fato.
 *
 * Uso (a partir de automação/, com o wrapper de env local já exportado):
 *   npx ts-node scripts/local-homologation-fixtures.ts --execute --athletes=250 --concurrency=10
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import {
  assertLocalHomologationEnvironment,
  buildLocalHomologationRunId,
} from '../tests/support/local-homologation-guard';
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

const FIRST_NAMES = ['Ana', 'Bruno', 'Carla', 'Diego', 'Elisa', 'Felipe', 'Gabriela', 'Hugo', 'Isabela', 'João', 'Karina', 'Lucas', 'Marina', 'Nicolas', 'Olivia', 'Pedro', 'Quésia', 'Rafael', 'Sofia', 'Tiago'];
const LAST_NAMES = ['Almeida', 'Barbosa', 'Costa', 'Dias', 'Esteves', 'Ferreira', 'Gomes', 'Henriques', 'Ibrahim', 'Jardim', 'Lima', 'Martins', 'Nogueira', 'Oliveira', 'Pereira', 'Queiroz', 'Ramos', 'Souza', 'Teixeira', 'Vieira'];
const BELT_NAMES = ['branca', 'cinza', 'amarela', 'laranja', 'verde', 'azul', 'roxa', 'marrom', 'preta'];

function syntheticName(index: number) {
  const first = FIRST_NAMES[index % FIRST_NAMES.length];
  const last = LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length];
  return `MC-LOCAL Atleta ${String(index + 1).padStart(4, '0')} ${first} ${last}`;
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

/**
 * Achado desta rodada (250 atletas): escolher mês/dia de nascimento aleatoriamente dentro do ano
 * `eventDate.year - age` tem ~1/12 de chance de cair DEPOIS do mês/dia do `eventDate`, fazendo
 * `age(eventDate, nascimento)` (a mesma expressão usada por `create_event_registrations`) resolver
 * para `age - 1` — um atleta "sem categoria elegível" por um dia de diferença, não um bug do
 * produto. Correção: sempre subtrai uma margem (10–300 dias) do marco de `age` anos, garantindo
 * que o aniversário já tenha passado em relação ao `eventDate`.
 */
function birthDateForAge(age: number, eventDate: Date) {
  const birth = new Date(eventDate);
  birth.setFullYear(birth.getFullYear() - age);
  birth.setDate(birth.getDate() - (10 + Math.floor(Math.random() * 290)));
  return birth.toISOString().slice(0, 10);
}

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
  const options = parseArgs(process.argv.slice(2));
  const env = assertLocalHomologationEnvironment(process.env);
  const runId = buildLocalHomologationRunId();

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
      `Catálogo GI publicado não encontrado no stack local. Detalhe: ${catalogError?.message || 'nenhum catálogo publicado'}`,
    );
  }
  const definitions = [...catalog.sport_category_definitions].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)) as CatalogCategoryDefinition[];
  console.log(`[${runId}] Catálogo: ${catalog.nome} v${catalog.versao} · ${definitions.length} definições.`);

  const eventDate = new Date();
  eventDate.setDate(eventDate.getDate() + 30);
  const athletes = Array.from({ length: options.athleteCount }, (_, index) =>
    syntheticAthleteFor(definitions[index % definitions.length], index, eventDate));

  // Categorias "Pesadíssimo"/abertas não têm peso_max_kg no catálogo (teto aberto, por natureza
  // da divisão) — a UI real exige que o operador informe um teto manualmente nesse caso
  // (expandCatalogSelectionToCategoryRows). Para a simulação, aplica-se o mesmo teto que um
  // operador real usaria: peso mínimo da categoria + 30kg, arredondado.
  const overrides = Object.fromEntries(
    definitions
      .filter((definition) => definition.peso_max_kg == null || definition.idade_max == null)
      .map((definition) => [definition.id, {
        ...(definition.peso_max_kg == null
          ? { pesoMax: String(Math.round((Number(definition.peso_min_kg) + 30) * 100) / 100) }
          : {}),
        ...(definition.idade_max == null ? { idadeMax: String(definition.idade_min + 40) } : {}),
      }]),
  );
  const expanded = expandCatalogSelectionToCategoryRows(definitions, overrides, null);
  if (!expanded.ok) {
    throw new Error(`Catálogo do alvo tem divisão sem teto que este gerador não resolve automaticamente: ${expanded.message}.`);
  }
  console.log(`[${runId}] Seleção "todas": ${expanded.rows.length} categorias efetivas a partir de ${definitions.length} definições.`);

  const plan = {
    runId,
    target: env.host,
    organization: `MC-LOCAL Organização ${runId}`,
    event: `MC-LOCAL Evento ${runId}`,
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
  const ownerEmail = `local-owner-${runId.toLowerCase()}@mc-local.invalid`;
  const ownerPassword = `${crypto.randomUUID()}Aa1!`;
  const { data: createdUser, error: userError } = await admin.auth.admin.createUser({
    email: ownerEmail,
    password: ownerPassword,
    email_confirm: true,
    user_metadata: { synthetic: true, run_id: runId, nome_completo: 'MC-LOCAL Owner Sintético' },
  });
  if (userError || !createdUser.user) throw new Error(`Falha ao criar usuário sintético: ${userError?.message}`);
  const ownerId = createdUser.user.id;

  // `create_managed_athlete` e `create_event_registrations` exigem auth.uid() (SECURITY DEFINER
  // que lê o ator autenticado) — o client de service role não carrega sessão, então as chamadas
  // que dependem de auth.uid() usam este client autenticado como o owner sintético, nunca o admin.
  const publishableKey = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '').trim();
  if (!publishableKey) throw new Error('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ausente — necessária para autenticar o owner sintético.');
  const asOwner = createClient(env.supabaseUrl, publishableKey, { auth: { persistSession: false } });
  const { error: signInError } = await asOwner.auth.signInWithPassword({ email: ownerEmail, password: ownerPassword });
  if (signInError) throw new Error(`Falha ao autenticar owner sintético: ${signInError.message}`);

  const { data: organization, error: orgError } = await admin.from('organizations').insert({
    nome: plan.organization,
    slug: `mc-local-${runId.toLowerCase()}`,
    created_by: ownerId,
  }).select('id').single();
  if (orgError || !organization) throw new Error(`Falha ao criar organização sintética: ${orgError?.message}`);

  const { error: memberError } = await admin.from('organization_members').insert({
    organization_id: organization.id,
    user_id: ownerId,
    role: 'owner',
  });
  if (memberError) throw new Error(`Falha ao vincular owner sintético: ${memberError.message}`);

  // Criado diretamente em status "inscricao": o gate de transição (enforce_event_status_transition)
  // só guarda UPDATE, não INSERT — e o objetivo desta simulação é a RPC de inscrição sob carga, não
  // o ciclo de vida administrativo do evento (já coberto pelos specs Playwright de integração).
  const { data: event, error: eventError } = await admin.from('events').insert({
    organization_id: organization.id,
    nome: plan.event,
    slug: `mc-local-evento-${runId.toLowerCase()}`,
    data_evento: eventDate.toISOString().slice(0, 10),
    local: 'Ginásio sintético de homologação local',
    valor_inscricao: 0,
    created_by: ownerId,
    status: 'inscricao',
  }).select('id').single();
  if (eventError || !event) throw new Error(`Falha ao criar evento sintético: ${eventError.message}`);

  const now = new Date();
  const phaseTypesList = ['inscricao', 'pagamento', 'checagem', 'chaves'] as const;
  const phaseWindows: Array<{ tipo: typeof phaseTypesList[number]; inicio: Date; fim: Date }> = [];
  let cursor = new Date(now);
  cursor.setDate(cursor.getDate() - 1);
  for (const tipo of phaseTypesList) {
    const inicio = new Date(cursor);
    const fim = new Date(inicio);
    fim.setDate(fim.getDate() + 5);
    phaseWindows.push({ tipo, inicio, fim });
    cursor = fim;
  }
  const phaseRows = phaseWindows.map(({ tipo, inicio, fim }) => ({
    event_id: event.id,
    tipo,
    inicio: inicio.toISOString(),
    fim: fim.toISOString(),
  }));
  const { error: phasesError } = await admin.from('event_phases').insert(phaseRows);
  if (phasesError) throw new Error(`Falha ao gravar fases do evento sintético: ${phasesError.message}`);

  const { data: rule, error: ruleError } = await admin.from('category_rule_sets').insert({
    event_id: event.id,
    nome: `MC-LOCAL Catálogo completo ${runId}`,
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

  const { error: activateError } = await admin.rpc('activate_category_rule_set', { p_rule_set_id: rule.id });
  if (activateError) throw new Error(`Falha ao ativar versão de categorias via RPC: ${activateError.message}`);
  console.log(`[${runId}] Versão de categorias ativa (via activate_category_rule_set): ${expanded.rows.length} categorias efetivas.`);

  // athletes.team_id é NOT NULL (achado desta rodada — scripts de fixture anteriores nunca foram
  // executados contra um schema real, ver docs/engineering/CURRENT-HANDOFF.md). Distribui os
  // atletas sintéticos por 1 equipe para cada 25, como uma academia real faria.
  const teamCount = Math.max(1, Math.ceil(athletes.length / 25));
  const teamRows = Array.from({ length: teamCount }, (_, index) => ({
    organization_id: organization.id,
    nome: `MC-LOCAL Equipe ${String(index + 1).padStart(2, '0')} ${runId}`,
    created_by: ownerId,
  }));
  const { data: insertedTeams, error: teamsError } = await admin.from('teams').insert(teamRows).select('id');
  if (teamsError || !insertedTeams) throw new Error(`Falha ao criar equipes sintéticas: ${teamsError?.message}`);

  // create_managed_athlete (SECURITY DEFINER) cria o atleta E o vínculo em athlete_managers
  // (manager_id = auth.uid()) na mesma transação — é o caminho real da UI, por isso é usado aqui
  // em vez de um insert direto em `athletes` (que deixaria o atleta sem manager, e
  // create_event_registrations exige manages_athlete() = true para inscrever).
  const athleteIds: string[] = [];
  const athleteCreationFailures: Array<{ index: number; message: string }> = [];
  for (let index = 0; index < athletes.length; index++) {
    const athlete = athletes[index];
    const teamId = insertedTeams[index % insertedTeams.length].id;
    const { data: athleteId, error: createAthleteError } = await asOwner.rpc('create_managed_athlete', {
      target_team_id: teamId,
      athlete_name: athlete.nome_completo,
      athlete_birth_date: athlete.data_nascimento,
      athlete_gender: athlete.genero,
      athlete_belt: athlete.faixa,
      athlete_weight: athlete.peso_kg,
      relationship: 'professor',
    });
    if (createAthleteError || !athleteId) {
      athleteCreationFailures.push({ index, message: createAthleteError?.message || 'sem id retornado' });
      continue;
    }
    athleteIds.push(athleteId as string);
  }
  if (athleteCreationFailures.length > 0) {
    console.warn(`[${runId}] ${athleteCreationFailures.length} atletas falharam na criação (amostra):`, athleteCreationFailures.slice(0, 5));
  }
  console.log(`[${runId}] ${athleteIds.length}/${athletes.length} atletas sintéticos criados via create_managed_athlete.`);

  const batches: string[][] = [];
  for (let start = 0; start < athleteIds.length; start += options.concurrency) {
    batches.push(athleteIds.slice(start, start + options.concurrency));
  }

  const results: Array<{ athleteId: string; ok: boolean; message?: string; durationMs: number }> = [];
  for (const batch of batches) {
    const batchResults = await Promise.allSettled(batch.map(async (athleteId) => {
      const startedAt = Date.now();
      const { error } = await asOwner.rpc('create_event_registrations', {
        target_event_id: event.id,
        target_athlete_ids: [athleteId],
        accepted_terms_version: 'MVP-2026-09',
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
  const durations = results.map((result) => result.durationMs).sort((a, b) => a - b);
  const p50 = durations[Math.floor(durations.length * 0.5)] ?? 0;
  const p95 = durations[Math.floor(durations.length * 0.95)] ?? 0;
  const report = {
    runId,
    target: env.host,
    event: { id: event.id, nome: plan.event },
    organization: { id: organization.id, nome: plan.organization },
    athleteCount: athletes.length,
    effectiveCategoryCount: expanded.rows.length,
    concurrency: options.concurrency,
    registrations: { attempted: results.length, succeeded, failed: results.length - succeeded },
    latencyMs: { p50, p95, max: durations[durations.length - 1] ?? 0 },
    failures: results.filter((result) => !result.ok).slice(0, 50),
  };
  const evidenceDir = path.resolve(__dirname, '../../docs/releases/evidencias');
  mkdirSync(evidenceDir, { recursive: true });
  const reportPath = path.join(evidenceDir, `local-homologation-${runId}.json`);
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`[${runId}] Inscrições: ${succeeded}/${results.length} com sucesso. p50=${p50}ms p95=${p95}ms. Relatório: ${reportPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
