import { defineConfig, devices } from '@playwright/test'
import { TestOptions } from '@sas/e2e'

export default defineConfig<TestOptions>({
  testDir: './create-e2e-data',
  fullyParallel: true,
  forbidOnly: true,
  retries: 1,
  maxFailures: 1,
  workers: 2,
  reporter: [['html', { outputFolder: '../test_results/test-data-setup/report' }]],
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
})
