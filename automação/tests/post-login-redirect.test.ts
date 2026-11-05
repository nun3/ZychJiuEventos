import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  isSafePostLoginPath,
  resolveAdminPostLoginRedirect,
  resolvePostLoginRedirect,
} from '../../lib/auth/post-login-redirect';

test('redirecionamento administrativo usa /admin/eventos por padrão e preserva destinos internos válidos', () => {
  assert.equal(resolveAdminPostLoginRedirect(null), '/admin/eventos');
  assert.equal(resolveAdminPostLoginRedirect(''), '/admin/eventos');
  assert.equal(resolveAdminPostLoginRedirect('/admin/eventos/novo'), '/admin/eventos/novo');
  assert.equal(
    resolveAdminPostLoginRedirect('/admin/eventos/52bb0f67-dba2-478c-9551-6c3c4e902feb/operacao'),
    '/admin/eventos/52bb0f67-dba2-478c-9551-6c3c4e902feb/operacao',
  );
});

test('redirecionamento pós-login bloqueia URLs externas, protocol-relative e loops para rotas de login', () => {
  assert.equal(isSafePostLoginPath('https://evil.example/phish'), false);
  assert.equal(isSafePostLoginPath('//evil.example/phish'), false);
  assert.equal(isSafePostLoginPath('/admin/autenticacao'), false);
  assert.equal(isSafePostLoginPath('/admin/autenticacao?redirectTo=%2Fadmin%2Feventos'), false);
  assert.equal(isSafePostLoginPath('/login'), false);
  assert.equal(isSafePostLoginPath('/login?redirectTo=%2Fdashboard'), false);

  assert.equal(resolveAdminPostLoginRedirect('//evil.example'), '/admin/eventos');
  assert.equal(resolveAdminPostLoginRedirect('/admin/autenticacao'), '/admin/eventos');
  assert.equal(resolvePostLoginRedirect('/login?mode=login'), '/dashboard');
  assert.equal(resolvePostLoginRedirect('/dashboard/organizacao'), '/dashboard/organizacao');
});
