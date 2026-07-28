import { defineConfig, devices, PlaywrightTestConfig } from '@playwright/test'
import { TestOptions } from '@sas/e2e'
import { config } from 'dotenv'

config({
  path: '.env.e2e.setup',
  override: true,
})

export const setupConfig: PlaywrightTestConfig = {
  testDir: './setup',
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  maxFailures: 1,
  workers: 2,
  reporter: [['html', { outputFolder: '../test_results/e2e-data-setup/report' }]],
  outputDir: '../test_results/e2e-data-setup/artefacts',
  timeout: 5 * 60 * 1000, // 3 minutes
  globalTimeout: 15 * 60 * 1000, // 15 minutes
  use: {
    trace: 'off',
    video: 'off',
    screenshot: 'only-on-failure',
    actionTimeout: 30 * 1000, // 30 seconds
    navigationTimeout: 30 * 1000, // 30 seconds
    ...devices['Desktop Chrome'],
  },
}

export default defineConfig<TestOptions>(setupConfig)
