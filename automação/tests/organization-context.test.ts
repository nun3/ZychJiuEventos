import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveAuthenticatedOrganizationContext } from '../../lib/auth/organization-context';

const meuCamp = '8c13e5c0-0000-4000-8000-00000000d4db';
const ricardo = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';

const memberships = [
  { organizationId: ricardo, organizationName: 'Organização Teste Ricardo', role: 'owner' },
  { organizationId: meuCamp, organizationName: 'MEU CAMP', role: 'owner' },
];

test('usuário com Ricardo + MEU CAMP e env MEU CAMP seleciona MEU CAMP', () => {
  const resolved = resolveAuthenticatedOrganizationContext(memberships, { PUBLIC_ORGANIZATION_ID: meuCamp });
  assert.deepEqual(resolved, {
    status: 'resolved',
    context: { organizationId: meuCamp, organizationName: 'MEU CAMP', role: 'owner' },
  });
});

test('usuário com Ricardo + MEU CAMP e env Ricardo seleciona Ricardo', () => {
  const resolved = resolveAuthenticatedOrganizationContext(memberships, { PUBLIC_ORGANIZATION_ID: ricardo });
  assert.deepEqual(resolved, {
    status: 'resolved',
    context: { organizationId: ricardo, organizationName: 'Organização Teste Ricardo', role: 'owner' },
  });
});

test('env de organização sem membership falha fechado e não cai na outra', () => {
  const resolved = resolveAuthenticatedOrganizationContext(memberships, { PUBLIC_ORGANIZATION_ID: other });
  assert.deepEqual(resolved, { status: 'unavailable', reason: 'none' });
});

test('env ausente e mais de uma filiação administrativa exige escolha explícita, sem escolher arbitrariamente', () => {
  const resolved = resolveAuthenticatedOrganizationContext(memberships, {});
  assert.deepEqual(resolved, { status: 'unavailable', reason: 'ambiguous', options: memberships });
});

test('env ausente e uma única filiação administrativa resolve normalmente', () => {
  const resolved = resolveAuthenticatedOrganizationContext([memberships[1]], {});
  assert.deepEqual(resolved, { status: 'resolved', context: memberships[1] });
});

test('env ausente e nenhuma filiação administrativa falha fechado por ausência', () => {
  const resolved = resolveAuthenticatedOrganizationContext([], {});
  assert.deepEqual(resolved, { status: 'unavailable', reason: 'none' });
});

test('mais de uma filiação e escolha explícita de organização existente resolve para a escolhida', () => {
  const resolved = resolveAuthenticatedOrganizationContext(memberships, {}, meuCamp);
  assert.deepEqual(resolved, {
    status: 'resolved',
    context: { organizationId: meuCamp, organizationName: 'MEU CAMP', role: 'owner' },
  });
});

test('mais de uma filiação e escolha explícita de organização que não é filiação do usuário falha fechado', () => {
  const resolved = resolveAuthenticatedOrganizationContext(memberships, {}, other);
  assert.deepEqual(resolved, { status: 'unavailable', reason: 'invalid-choice', options: memberships });
});

test('uma única filiação ignora qualquer organizationId pedido e resolve pela única filiação', () => {
  const resolved = resolveAuthenticatedOrganizationContext([memberships[1]], {}, ricardo);
  assert.deepEqual(resolved, { status: 'resolved', context: memberships[1] });
});
