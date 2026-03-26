import { config } from 'dotenv'
import { defineConfig, devices } from '@playwright/test'
import { TestOptions } from '@sas/e2e'

config({
  path: 'e2e.env',
  override: true,
})

export default defineConfig<TestOptions>({
  testDir: './',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  maxFailures: process.env.CI ? 3 : 1,
  workers: 2,
  reporter: [['html', { outputFolder: '../test_results/e2e/report' }]],
  outputDir: '../test_results/e2e',
  timeout: process.env.CI ? 5 * 60 * 1000 : 2 * 60 * 1000,
  use: {
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10 * 1000,
    navigationTimeout: 30 * 1000,
    ...devices['Desktop Chrome'],
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
  },
})
