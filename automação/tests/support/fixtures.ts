import { test as base } from 'playwright-bdd';
import { LoginPage } from '../pages/LoginPage';
import { paymentFixture, type PaymentFixture } from './payment-fixture';
import { checagemFixture, type ChecagemFixture } from './checagem-fixture';
import { operationalEventFixture, type OperationalEventFixture } from './operational-event-fixture';
import type { APIResponse } from '@playwright/test';

type ScenarioData = {
  suffix: string;
  teamOne: string;
  teamTwo: string;
  athlete: string;
  event: string;
};

export const test = base.extend<{
  loginPage: LoginPage;
  scenarioData: ScenarioData;
  paymentData: PaymentFixture;
  checagemData: ChecagemFixture;
  liveEventData: OperationalEventFixture;
  webhookState: { response?: APIResponse };
}>({
  webhookState: async ({}, use) => use({}),
  checagemData: async ({}, use) => {
    base.skip(process.env.E2E_ALLOW_WRITES !== 'true', 'Defina E2E_ALLOW_WRITES=true para fixtures de checagem no Sandbox.');
    const data = checagemFixture();
    try {
      await data.setup();
      await use(data);
    } finally {
      await data.cleanup();
    }
  },
  liveEventData: async ({}, use) => {
    base.skip(process.env.E2E_ALLOW_WRITES !== 'true', 'Defina E2E_ALLOW_WRITES=true para fixtures operacionais no Sandbox.');
    const data = operationalEventFixture('em_andamento');
    try {
      await data.setup();
      await use(data);
    } finally {
      await data.cleanup();
    }
  },
  paymentData: async ({}, use) => {
    base.skip(process.env.E2E_ALLOW_WRITES !== 'true', 'Defina E2E_ALLOW_WRITES=true para fixtures de pagamentos no Sandbox.');
    const data = paymentFixture();
    try {
      await data.setup();
      await use(data);
    } finally {
      await data.cleanup();
    }
  },
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  scenarioData: async ({}, use) => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    await use({
      suffix,
      teamOne: `E2E Equipe A ${suffix}`,
      teamTwo: `E2E Equipe B ${suffix}`,
      athlete: `Atleta E2E ${suffix}`,
      event: `Evento E2E ${suffix}`,
    });
  },
});
