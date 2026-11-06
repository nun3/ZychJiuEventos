import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  assertIndependentHomologationEnvironment,
  buildIndependentHomologationRunId,
  PRODUCTION_SANDBOX_HOST,
} from '../tests/support/independent-homologation-guard';

const disposableEnv = {
  HOMOLOG_ALLOW_WRITES: 'true',
  HOMOLOG_SUPABASE_URL: 'https://abcdefghijklmnop.supabase.co',
  HOMOLOG_SUPABASE_SERVICE_ROLE_KEY: 'service-role-fixture-key',
};

test('recusa sem HOMOLOG_ALLOW_WRITES=true', () => {
  assert.throws(() => assertIndependentHomologationEnvironment({ ...disposableEnv, HOMOLOG_ALLOW_WRITES: 'false' }), /HOMOLOG_ALLOW_WRITES/);
  assert.throws(() => assertIndependentHomologationEnvironment({ ...disposableEnv, HOMOLOG_ALLOW_WRITES: undefined }), /HOMOLOG_ALLOW_WRITES/);
});

test('recusa sem URL ou sem chave de serviço independentes', () => {
  assert.throws(() => assertIndependentHomologationEnvironment({ ...disposableEnv, HOMOLOG_SUPABASE_URL: '' }), /HOMOLOG_SUPABASE_URL/);
  assert.throws(() => assertIndependentHomologationEnvironment({ ...disposableEnv, HOMOLOG_SUPABASE_SERVICE_ROLE_KEY: '' }), /HOMOLOG_SUPABASE_URL/);
});

test('recusa explicitamente o host do zigjiu, mesmo com HOMOLOG_* preenchido', () => {
  assert.throws(
    () => assertIndependentHomologationEnvironment({
      ...disposableEnv,
      HOMOLOG_SUPABASE_URL: `https://${PRODUCTION_SANDBOX_HOST}`,
    }),
    /zigjiu/,
  );
});

test('recusa ambiente de Production mesmo com projeto independente configurado', () => {
  assert.throws(
    () => assertIndependentHomologationEnvironment({ ...disposableEnv, VERCEL_ENV: 'production' }),
    /Production/,
  );
});

test('resolve normalmente com um projeto independente e escrita habilitada', () => {
  const resolved = assertIndependentHomologationEnvironment(disposableEnv);
  assert.equal(resolved.host, 'abcdefghijklmnop.supabase.co');
  assert.equal(resolved.supabaseUrl, disposableEnv.HOMOLOG_SUPABASE_URL);
});

test('run id é estável no formato e distinto do formato do run id do sandbox (MC-E2E-)', () => {
  const runId = buildIndependentHomologationRunId(new Date('2026-11-06T10:00:00-03:00'));
  assert.match(runId, /^MC-HOMOLOG-20261106-\d{6}$/);
  assert.doesNotMatch(runId, /^MC-E2E-/);
});
