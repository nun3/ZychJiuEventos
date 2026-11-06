import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  assertLocalHomologationEnvironment,
  buildLocalHomologationRunId,
  PRODUCTION_SANDBOX_HOST,
} from '../tests/support/local-homologation-guard';

const localEnv = {
  E2E_ALLOW_WRITES: 'true',
  NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_SECRET_KEY: 'sb_secret_fixture-key',
};

test('recusa sem E2E_ALLOW_WRITES=true', () => {
  assert.throws(() => assertLocalHomologationEnvironment({ ...localEnv, E2E_ALLOW_WRITES: 'false' }), /E2E_ALLOW_WRITES/);
  assert.throws(() => assertLocalHomologationEnvironment({ ...localEnv, E2E_ALLOW_WRITES: undefined }), /E2E_ALLOW_WRITES/);
});

test('recusa sem URL ou sem chave de serviço', () => {
  assert.throws(() => assertLocalHomologationEnvironment({ ...localEnv, NEXT_PUBLIC_SUPABASE_URL: '' }), /NEXT_PUBLIC_SUPABASE_URL/);
  assert.throws(() => assertLocalHomologationEnvironment({ ...localEnv, SUPABASE_SECRET_KEY: '' }), /NEXT_PUBLIC_SUPABASE_URL/);
});

test('recusa explicitamente o host do zigjiu', () => {
  assert.throws(
    () => assertLocalHomologationEnvironment({ ...localEnv, NEXT_PUBLIC_SUPABASE_URL: `https://${PRODUCTION_SANDBOX_HOST}` }),
    /zigjiu|produção/,
  );
});

test('recusa qualquer host *.supabase.co, não só o zigjiu', () => {
  assert.throws(
    () => assertLocalHomologationEnvironment({ ...localEnv, NEXT_PUBLIC_SUPABASE_URL: 'https://outro-projeto.supabase.co' }),
    /produção/,
  );
});

test('recusa host que não seja 127.0.0.1/localhost', () => {
  assert.throws(
    () => assertLocalHomologationEnvironment({ ...localEnv, NEXT_PUBLIC_SUPABASE_URL: 'http://192.168.0.10:54321' }),
    /localhost/,
  );
});

test('recusa ambiente de Production mesmo com host local', () => {
  assert.throws(
    () => assertLocalHomologationEnvironment({ ...localEnv, VERCEL_ENV: 'production' }),
    /Production/,
  );
});

test('resolve normalmente com o stack local e escrita habilitada', () => {
  const resolved = assertLocalHomologationEnvironment(localEnv);
  assert.equal(resolved.host, '127.0.0.1:54321');
  assert.equal(resolved.supabaseUrl, localEnv.NEXT_PUBLIC_SUPABASE_URL);
});

test('run id é estável no formato e distinto dos demais prefixos', () => {
  const runId = buildLocalHomologationRunId(new Date('2026-11-06T10:00:00-03:00'));
  assert.match(runId, /^MC-LOCAL-20261106-\d{6}$/);
  assert.doesNotMatch(runId, /^MC-E2E-|^MC-HOMOLOG-/);
});
