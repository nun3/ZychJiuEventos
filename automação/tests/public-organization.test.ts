import assert from 'node:assert/strict';
import { test } from 'node:test';
import { allowsPublicOrganization, getPublicOrganizationScope } from '../../lib/events/public-organization';

const org = '8c13e5c0-0000-4000-8000-00000000d4db';

test('sem PUBLIC_ORGANIZATION_ID o catálogo público permanece multi-organização', () => {
  assert.deepEqual(getPublicOrganizationScope({}), { mode: 'unrestricted' });
  assert.equal(allowsPublicOrganization(org, {}), true);
});

test('PUBLIC_ORGANIZATION_ID válido restringe à organização configurada', () => {
  const env = { PUBLIC_ORGANIZATION_ID: org };
  assert.deepEqual(getPublicOrganizationScope(env), { mode: 'restricted', organizationId: org });
  assert.equal(allowsPublicOrganization(org, env), true);
  assert.equal(allowsPublicOrganization('11111111-1111-4111-8111-111111111111', env), false);
});

test('PUBLIC_ORGANIZATION_ID inválido não libera o catálogo inteiro', () => {
  const env = { PUBLIC_ORGANIZATION_ID: 'meu-camp' };
  assert.deepEqual(getPublicOrganizationScope(env), { mode: 'blocked' });
  assert.equal(allowsPublicOrganization(org, env), false);
});
