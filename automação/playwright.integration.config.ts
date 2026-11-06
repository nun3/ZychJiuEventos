import { defineConfig } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const localEnvPath = path.resolve(process.cwd(), '.env.e2e');
if (fs.existsSync(localEnvPath)) {
  for (const line of fs.readFileSync(localEnvPath, 'utf8').split(/\r?\n/)) {
    const normalized = line.trim();
    if (!normalized || normalized.startsWith('#')) continue;
    const separator = normalized.indexOf('=');
    if (separator < 1) continue;
    const key = normalized.slice(0, separator).trim();
    const value = normalized.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

export default defineConfig({
  testDir: './tests',
  testMatch: 'integration-lots.spec.ts',
  timeout: 30000,
  fullyParallel: false,
  workers: 1,
  expect: { timeout: 10000 },
  use: {
    headless: true,
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:3030',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  reporter: [['list']],
});
