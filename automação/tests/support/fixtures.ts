import { test as base } from 'playwright-bdd';
import { LoginPage } from '../pages/LoginPage';
import { paymentFixture, type PaymentFixture } from './payment-fixture';
import { checagemFixture, type ChecagemFixture } from './checagem-fixture';
import { operationalEventFixture, type OperationalEventFixture } from './operational-event-fixture';
import { createFullEventJourney, type FullEventJourney } from './full-event-journey';
import { financialClosingFixture, type FinancialClosingFixture } from './financial-closing-fixture';
import { platformFeeFixture, type PlatformFeeFixture } from './platform-fee-fixture';
import { publicCheckingFixture, type PublicCheckingFixture } from './public-checking-fixture';
import { professorFixture, type ProfessorFixture } from './professor-fixture';
import { operationalProfessorFixture, type OperationalProfessorFixture } from './operational-professor-fixture';
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
  fullEvent: FullEventJourney;
  closingData: FinancialClosingFixture;
  platformFeeData: PlatformFeeFixture;
  publicCheckingData: PublicCheckingFixture;
  professorData: ProfessorFixture;
  operationalProfessorData: OperationalProfessorFixture;
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
  closingData: async ({}, use) => {
    base.skip(process.env.E2E_ALLOW_WRITES !== 'true', 'Defina E2E_ALLOW_WRITES=true para fixtures de fechamento no Sandbox.');
    const data = financialClosingFixture();
    try {
      await data.setup();
      await use(data);
    } finally {
      await data.cleanup();
    }
  },
  platformFeeData: async ({}, use, testInfo) => {
    base.skip(process.env.E2E_ALLOW_WRITES !== 'true', 'Defina E2E_ALLOW_WRITES=true para fixtures de taxa no Sandbox.');
    testInfo.setTimeout(120_000);
    const data = platformFeeFixture();
    try {
      await data.setup();
      await use(data);
    } finally {
      await data.cleanup();
    }
  },
  publicCheckingData: async ({}, use) => {
    base.skip(process.env.E2E_ALLOW_WRITES !== 'true', 'Defina E2E_ALLOW_WRITES=true para fixtures de checagem pública no Sandbox.');
    const data = publicCheckingFixture();
    try {
      await data.setup();
      await use(data);
    } finally {
      await data.cleanup();
    }
  },
  professorData: async ({}, use, testInfo) => {
    base.skip(process.env.E2E_ALLOW_WRITES !== 'true', 'Defina E2E_ALLOW_WRITES=true para fixtures de professor no Sandbox.');
    testInfo.setTimeout(120_000);
    const data = professorFixture();
    try {
      await data.setup();
      await use(data);
    } finally {
      await data.cleanup();
    }
  },
  operationalProfessorData: async ({}, use, testInfo) => {
    base.skip(process.env.E2E_ALLOW_WRITES !== 'true', 'Defina E2E_ALLOW_WRITES=true para fixtures de professor operacional no Sandbox.');
    testInfo.setTimeout(120_000);
    const data = operationalProfessorFixture();
    try {
      await data.setup();
      await use(data);
    } finally {
      await data.cleanup();
    }
  },
  fullEvent: async ({ page, context, browser }, use, testInfo) => {
    base.skip(process.env.E2E_ALLOW_WRITES !== 'true', 'Defina E2E_ALLOW_WRITES=true para a jornada Full Event no Sandbox.');
    testInfo.setTimeout(480_000);
    const journey = await createFullEventJourney({
      page,
      context,
      browser,
      baseURL: process.env.BASE_URL || 'http://localhost:3000',
    });
    try {
      await use(journey);
    } finally {
      await journey.cleanup();
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
