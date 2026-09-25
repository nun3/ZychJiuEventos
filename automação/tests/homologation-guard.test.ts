import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SANDBOX_HOST,
  SANDBOX_REF,
  assertHomologationEnvironment,
  assertHomologationWritesEnabled,
  buildHomologationRunId,
} from './support/homologation-guard';

const validOrg = '8c13e5c0-1111-2222-3333-444444444444';
const sandboxEnv = {
  E2E_ALLOW_WRITES: 'true',
  NEXT_PUBLIC_SUPABASE_URL: `https://${SANDBOX_HOST}`,
  PAYMENTS_MANUAL_ONLY: 'true',
  PUBLIC_ORGANIZATION_ID: validOrg,
} as NodeJS.ProcessEnv;

test('homologação recusa escrita quando E2E_ALLOW_WRITES não é true', () => {
  assert.throws(
    () => assertHomologationWritesEnabled({ E2E_ALLOW_WRITES: 'false' }),
    /E2E_ALLOW_WRITES não é true/,
  );
});

test('homologação aborta fora do Sandbox autorizado', () => {
  assert.throws(
    () => assertHomologationEnvironment({
      ...sandboxEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://aaaaaaaaaaaaaaaaaaaa.supabase.co',
    }),
    /não é o Sandbox/,
  );
});

test('homologação aborta em Production e sem baixa manual', () => {
  assert.throws(
    () => assertHomologationEnvironment({ ...sandboxEnv, VERCEL_ENV: 'production' }),
    /Production/,
  );
  assert.throws(
    () => assertHomologationEnvironment({ ...sandboxEnv, PAYMENTS_MANUAL_ONLY: 'false' }),
    /PAYMENTS_MANUAL_ONLY/,
  );
});

test('homologação aceita o Sandbox zigjiu com MEU CAMP e baixa manual', () => {
  const resolved = assertHomologationEnvironment(sandboxEnv);
  assert.equal(resolved.host, SANDBOX_HOST);
  assert.equal(resolved.organizationId, validOrg);
  assert.match(SANDBOX_REF, /^kfvypacjzlzwwblsbpwj$/);
});

test('run id de homologação é rastreável e não genérico', () => {
  const runId = buildHomologationRunId(new Date('2026-09-19T18:24:31Z'));
  assert.match(runId, /^MC-E2E-20260919-\d{6}$/);
  assert.doesNotMatch(runId, /teste/i);
});
