import { chromium } from '@playwright/test';
import { createFullEventJourney } from '../tests/support/full-event-journey';

async function run() {
  const baseURL = process.env.BASE_URL || 'http://localhost:3102';
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL, viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const journey = await createFullEventJourney({ page, context, browser, baseURL });
  try {
    await journey.prepare();
    await journey.runCanonical();
  } finally {
    await journey.cleanup();
    await context.close();
    await browser.close();
  }
  console.log(JSON.stringify(journey.report, null, 2));
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
