import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { test } from '../support/fixtures';

const { Given, When, Then } = createBdd(test);

Given('que o ambiente Sandbox da MEU CAMP foi confirmado antes de qualquer escrita', async ({ homologation }) => {
  await homologation.prepare();
});

When('cria as contas descartáveis da homologação', async ({ homologation }) => {
  await homologation.createUsers();
});

When('cadastra as equipes da execução na MEU CAMP', async ({ homologation }) => {
  await homologation.createTeams();
});

When('cadastra o atleta independente, o menor e os atletas gerenciados', async ({ homologation }) => {
  await homologation.createAthletes();
});

When('publica o evento de homologação com a categoria compatível', async ({ homologation }) => {
  await homologation.createEventAndCategory();
});

When('inscreve os quatro atletas pelos fluxos autorizados', async ({ homologation }) => {
  await homologation.registerAthletes();
});

When('reserva e efetiva as inscrições por baixa manual', async ({ homologation }) => {
  await homologation.reserveAndSettle();
});

Then('a checagem pública deve listar somente os efetivos da execução', async ({ homologation }) => {
  await homologation.openCheckingAndAssert();
});

When('solicita e revisa a correção auditada', async ({ homologation }) => {
  await homologation.exerciseAuditedCorrection();
});

When('trava a checagem da homologação', async ({ homologation }) => {
  await homologation.lockChecking();
});

When('gera, ajusta e publica a chave semi4', async ({ homologation }) => {
  await homologation.generateAndPublishBracket();
});

When('configura a área e a programação', async ({ homologation }) => {
  await homologation.configureAreaAndSchedule();
});

When('confirma a pesagem, inicia, registra resultados e premia', async ({ homologation }) => {
  await homologation.weighInStartAndResults();
});

When('consulta o financeiro e conclui o evento', async ({ homologation }) => {
  await homologation.financeAndConclude();
});

Then('o isolamento e o cleanup da execução devem estar limpos', async ({ homologation }) => {
  const report = await homologation.attachIdentity();
  expect(report.stages.isolamento).toBe('OK');
  expect(report.failedStep).toBeNull();
});
