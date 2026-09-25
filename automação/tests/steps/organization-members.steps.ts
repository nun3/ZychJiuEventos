import { createBdd } from 'playwright-bdd';
import { test } from '../support/fixtures';

const { Given, When, Then } = createBdd(test);

Given('a proteção do Sandbox para organizações', async ({ organizationMembers }) => {
  await organizationMembers.protect();
});

When('o platform admin cria a organização de homologação', async ({ organizationMembers }) => {
  await organizationMembers.createOrganization();
});

Then('o owner inicial fica associado', async ({ organizationMembers }) => {
  await organizationMembers.assertOwner();
});

Then('o owner adiciona organizer e finance', async ({ organizationMembers }) => {
  await organizationMembers.ownerAddsMembers();
});

Then('a duplicidade e a proteção do owner são recusadas', async ({ organizationMembers }) => {
  await organizationMembers.ownerGuards();
});

Then('organizer e finance não gerenciam membros', async ({ organizationMembers }) => {
  await organizationMembers.forbiddenRoles();
});

Then('o ataque cross-tenant falha', async ({ organizationMembers }) => {
  await organizationMembers.crossTenant();
});

Then('o owner remove o organizer', async ({ organizationMembers }) => {
  await organizationMembers.removeOrganizer();
  await organizationMembers.mobile();
});

Then('o cleanup remove somente o cenário', async ({ organizationMembers }) => {
  await organizationMembers.cleanup();
});
