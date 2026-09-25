import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveOwnedOrganizationContext } from '../../lib/auth/organization-context';
import {
  buildOrganizationRunId,
  isOwnerAssignableRole,
  mapMembershipError,
  organizationRoleLabel,
  slugifyOrganizationName,
} from '../../lib/organizations/membership';

const meuCamp = '8c13e5c0-0000-4000-8000-00000000d4db';
const ricardo = '11111111-1111-4111-8111-111111111111';
const homolog = '22222222-2222-4222-8222-222222222222';

test('roles existentes: owner, organizer, staff e finance; owner só atribui organizer e finance', () => {
  assert.equal(organizationRoleLabel('owner'), 'Proprietário');
  assert.equal(organizationRoleLabel('staff'), 'Staff');
  assert.equal(isOwnerAssignableRole('organizer'), true);
  assert.equal(isOwnerAssignableRole('finance'), true);
  assert.equal(isOwnerAssignableRole('owner'), false);
  assert.equal(isOwnerAssignableRole('staff'), false);
});

test('slug da organização segue a regra existente de identificador simples', () => {
  assert.equal(slugifyOrganizationName('Organização Homologação'), 'organizacao-homologacao');
  assert.match(slugifyOrganizationName('!!!'), /^organizacao$/);
});

test('mensagens de membership nao ficam vazias', () => {
  assert.match(mapMembershipError('O usuario precisa criar uma conta antes de ser associado a organizacao.'), /precisa criar uma conta/);
  assert.match(mapMembershipError('Usuario ja e membro desta organizacao.'), /já é membro/);
  assert.match(mapMembershipError('Acesso negado'), /não tem permissão/i);
  assert.match(mapMembershipError('Nao e permitido remover o owner.'), /proprietário/);
  assert.notEqual(mapMembershipError(''), '');
});

test('owner da organização da release prevalece sobre outra membership de owner', () => {
  const resolved = resolveOwnedOrganizationContext([
    { organizationId: ricardo, organizationName: 'Organização Teste Ricardo', role: 'owner' },
    { organizationId: meuCamp, organizationName: 'MEU CAMP', role: 'owner' },
  ], { PUBLIC_ORGANIZATION_ID: meuCamp });
  assert.deepEqual(resolved, {
    status: 'resolved',
    context: { organizationId: meuCamp, organizationName: 'MEU CAMP', role: 'owner' },
  });
});

test('owner de uma única org homologa mesmo com release diferente', () => {
  const resolved = resolveOwnedOrganizationContext([
    { organizationId: homolog, organizationName: 'MC-ORG-E2E', role: 'owner' },
  ], { PUBLIC_ORGANIZATION_ID: meuCamp });
  assert.deepEqual(resolved, {
    status: 'resolved',
    context: { organizationId: homolog, organizationName: 'MC-ORG-E2E', role: 'owner' },
  });
});

test('varias orgs fora da release nao escolhem tenant arbitrario', () => {
  const resolved = resolveOwnedOrganizationContext([
    { organizationId: ricardo, organizationName: 'Organização Teste Ricardo', role: 'owner' },
    { organizationId: homolog, organizationName: 'MC-ORG-E2E', role: 'owner' },
  ], { PUBLIC_ORGANIZATION_ID: meuCamp });
  assert.deepEqual(resolved, { status: 'unavailable' });
});

test('run id de organizacoes e rastreavel', () => {
  const runId = buildOrganizationRunId(new Date('2026-09-25T22:40:00Z'));
  assert.match(runId, /^MC-ORG-E2E-20260925-\d{6}$/);
});
