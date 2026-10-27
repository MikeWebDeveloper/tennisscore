import { defineConfig } from '@playwright/test'

/**
 * Shell tests against an already-running production build:
 *   PLAYWRIGHT=1 DISABLE_AUTH_FOR_TEST=1 npm run build && npx next start -p 3100
 *   npm run test:e2e:shell
 */
export default defineConfig({
  testDir: 'tests',
  testMatch: /(shell|watch|live-offline|lists)\.spec\.ts/,
  reporter: 'list',
  workers: 2,
  use: { baseURL: process.env.BASE_URL || 'http://localhost:3100', headless: true, launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH || undefined } },
  timeout: 30_000,
})
