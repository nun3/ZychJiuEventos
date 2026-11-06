/**
 * Guarda de ambiente para homologação num Supabase INDEPENDENTE de `zigjiu`.
 *
 * `homologation-guard.ts` (já existente) faz o oposto: exige que o host seja exatamente
 * `kfvypacjzlzwwblsbpwj.supabase.co` (o Sandbox, que hoje também é produção). Essa guarda aqui
 * é para o próximo passo da reconciliação — um projeto descartável, separado de `zigjiu` — e por
 * isso recusa com erro qualquer alvo que seja esse mesmo host. Nenhuma escrita deste script
 * acontece em `zigjiu`; é o oposto do que `homologation-guard.ts` permite.
 *
 * Lê variáveis com nomes próprios (`HOMOLOG_*`), nunca `NEXT_PUBLIC_SUPABASE_URL` nem
 * `SUPABASE_SECRET_KEY` — para que não haja como esta guarda "herdar" por engano as
 * credenciais de produção do `.env.local`.
 */

export const PRODUCTION_SANDBOX_HOST = 'kfvypacjzlzwwblsbpwj.supabase.co';

export type IndependentHomologationEnv = {
  supabaseUrl: string;
  serviceRoleKey: string;
  host: string;
};

export function assertIndependentHomologationWritesEnabled(env: NodeJS.ProcessEnv = process.env) {
  if (env.HOMOLOG_ALLOW_WRITES === 'true') return;
  throw new Error('Homologação independente bloqueada: HOMOLOG_ALLOW_WRITES não é "true". Nenhuma escrita foi feita.');
}

export function assertIndependentHomologationEnvironment(
  env: NodeJS.ProcessEnv = process.env,
): IndependentHomologationEnv {
  assertIndependentHomologationWritesEnabled(env);

  const supabaseUrl = (env.HOMOLOG_SUPABASE_URL || '').trim();
  const serviceRoleKey = (env.HOMOLOG_SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Homologação independente abortada: defina HOMOLOG_SUPABASE_URL e HOMOLOG_SUPABASE_SERVICE_ROLE_KEY ' +
      '(nunca NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY — essas são do zigjiu). Nenhuma escrita foi feita.',
    );
  }

  let host = '';
  try {
    host = new URL(supabaseUrl).hostname;
  } catch {
    throw new Error('Homologação independente abortada: HOMOLOG_SUPABASE_URL inválida. Nenhuma escrita foi feita.');
  }

  if (host === PRODUCTION_SANDBOX_HOST) {
    throw new Error(
      `Homologação independente abortada: HOMOLOG_SUPABASE_URL aponta para ${PRODUCTION_SANDBOX_HOST}, ` +
      'que é o zigjiu (sandbox e produção). Este script nunca escreve ali — use um projeto separado.',
    );
  }
  if (env.VERCEL_ENV === 'production' || env.NEXT_PUBLIC_VERCEL_ENV === 'production') {
    throw new Error('Homologação independente abortada: ambiente de Production detectado. Nenhuma escrita foi feita.');
  }

  return { supabaseUrl, serviceRoleKey, host };
}

export function buildIndependentHomologationRunId(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || '';
  return `MC-HOMOLOG-${value('year')}${value('month')}${value('day')}-${value('hour')}${value('minute')}${value('second')}`;
}
