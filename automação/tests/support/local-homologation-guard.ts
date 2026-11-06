/**
 * Guarda de ambiente para homologação no Supabase LOCAL (Docker, `supabase start`).
 *
 * Diferente de `independent-homologation-guard.ts` (que exige um projeto remoto descartável,
 * nunca provisionado), este guarda aceita como alvo válido só o host local do stack Docker
 * (`127.0.0.1`/`localhost`, porta padrão do CLI) e recusa com erro qualquer outro host —
 * especialmente o Sandbox/produção `kfvypacjzlzwwblsbpwj.supabase.co`.
 *
 * Lê `NEXT_PUBLIC_SUPABASE_URL`/`SUPABASE_SECRET_KEY` (as mesmas variáveis que a aplicação usa),
 * porque para o stack local não há risco de "herdar" credencial de produção por engano: a
 * verificação de host abaixo rejeita produção explicitamente antes de qualquer escrita.
 */

export const PRODUCTION_SANDBOX_HOST = 'kfvypacjzlzwwblsbpwj.supabase.co';
const LOCAL_HOSTNAMES = new Set(['127.0.0.1', 'localhost', '::1']);

export type LocalHomologationEnv = {
  supabaseUrl: string;
  serviceRoleKey: string;
  host: string;
};

export function assertLocalHomologationWritesEnabled(env: NodeJS.ProcessEnv = process.env) {
  if (env.E2E_ALLOW_WRITES === 'true') return;
  throw new Error('Homologação local bloqueada: E2E_ALLOW_WRITES não é "true". Nenhuma escrita foi feita.');
}

export function assertLocalHomologationEnvironment(env: NodeJS.ProcessEnv = process.env): LocalHomologationEnv {
  assertLocalHomologationWritesEnabled(env);

  const supabaseUrl = (env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const serviceRoleKey = (env.SUPABASE_SECRET_KEY || '').trim();
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Homologação local abortada: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY apontando ' +
      'para o stack local (http://127.0.0.1:54321). Nenhuma escrita foi feita.',
    );
  }

  let host = '';
  let hostname = '';
  try {
    const parsed = new URL(supabaseUrl);
    host = parsed.host;
    hostname = parsed.hostname;
  } catch {
    throw new Error('Homologação local abortada: NEXT_PUBLIC_SUPABASE_URL inválida. Nenhuma escrita foi feita.');
  }

  if (hostname === PRODUCTION_SANDBOX_HOST || hostname.endsWith('.supabase.co')) {
    throw new Error(
      `Homologação local abortada: NEXT_PUBLIC_SUPABASE_URL aponta para ${hostname}, que é um projeto ` +
      'Supabase hospedado (produção/zigjiu). Este script só escreve no stack local Docker. Nenhuma escrita foi feita.',
    );
  }
  if (!LOCAL_HOSTNAMES.has(hostname)) {
    throw new Error(
      `Homologação local abortada: host ${hostname} não é 127.0.0.1/localhost. Nenhuma escrita foi feita.`,
    );
  }
  if (env.VERCEL_ENV === 'production' || env.NEXT_PUBLIC_VERCEL_ENV === 'production') {
    throw new Error('Homologação local abortada: ambiente de Production detectado. Nenhuma escrita foi feita.');
  }

  return { supabaseUrl, serviceRoleKey, host };
}

export function buildLocalHomologationRunId(now = new Date()) {
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
  return `MC-LOCAL-${value('year')}${value('month')}${value('day')}-${value('hour')}${value('minute')}${value('second')}`;
}
