export const SANDBOX_REF = 'kfvypacjzlzwwblsbpwj';
export const SANDBOX_HOST = `${SANDBOX_REF}.supabase.co`;
export const RELEASE_ORG_NAME = 'MEU CAMP';

const PRODUCTION_HOSTS = [
  'supabase.co',
] as const;

export type HomologationEnv = {
  supabaseUrl: string;
  organizationId: string;
  host: string;
};

export function assertHomologationWritesEnabled(env: NodeJS.ProcessEnv = process.env) {
  if (env.E2E_ALLOW_WRITES === 'true') return;
  throw new Error('Homologação bloqueada: E2E_ALLOW_WRITES não é true. Nenhuma escrita foi feita.');
}

export function assertHomologationEnvironment(env: NodeJS.ProcessEnv = process.env): HomologationEnv {
  assertHomologationWritesEnabled(env);

  const supabaseUrl = (env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  let host = '';
  try {
    host = new URL(supabaseUrl).hostname;
  } catch {
    throw new Error('Homologação abortada: NEXT_PUBLIC_SUPABASE_URL inválida. Nenhuma escrita foi feita.');
  }
  if (host !== SANDBOX_HOST) {
    throw new Error(`Homologação abortada: host ${host} não é o Sandbox ${SANDBOX_HOST}. Nenhuma escrita foi feita.`);
  }
  if (host.includes('prod') || env.VERCEL_ENV === 'production' || env.NEXT_PUBLIC_VERCEL_ENV === 'production') {
    throw new Error('Homologação abortada: ambiente de Production detectado. Nenhuma escrita foi feita.');
  }
  if (env.PAYMENTS_MANUAL_ONLY !== 'true') {
    throw new Error('Homologação abortada: PAYMENTS_MANUAL_ONLY não é true. Nenhuma escrita foi feita.');
  }

  const organizationId = (env.PUBLIC_ORGANIZATION_ID || '').trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(organizationId)) {
    throw new Error('Homologação abortada: PUBLIC_ORGANIZATION_ID ausente ou inválido. Nenhuma escrita foi feita.');
  }

  void PRODUCTION_HOSTS;
  return { supabaseUrl, organizationId, host };
}

export function buildHomologationRunId(now = new Date()) {
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
  return `MC-E2E-${value('year')}${value('month')}${value('day')}-${value('hour')}${value('minute')}${value('second')}`;
}
