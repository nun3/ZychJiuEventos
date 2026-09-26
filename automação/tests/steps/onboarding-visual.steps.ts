import { createBdd } from 'playwright-bdd';
import { test } from '../support/fixtures';

const { Given, When, Then } = createBdd(test);

Given('a proteção do Sandbox para onboarding', async ({ onboardingVisual }) => {
  await onboardingVisual.protect();
});

When('o organizador conduz o evento temporário pelas fases', async ({ onboardingVisual }) => {
  await onboardingVisual.conduct();
});

Then('o cleanup remove somente o cenário de onboarding', async ({ onboardingVisual }) => {
  await onboardingVisual.cleanup();
});
