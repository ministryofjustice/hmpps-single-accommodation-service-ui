import { config } from 'dotenv'
import { defineConfig, devices } from '@playwright/test'
import { TestOptions } from '@sas/e2e'

config({
  path: '.env.e2e',
  override: true,
  quiet: true,
})

// Pick up any values produced locally by `npm run test:e2e:data:setup` (e.g. BASE_CASE_NAME),
config({
  path: 'tmp/TEST_ENV.txt',
  override: true,
  quiet: true,
})

if (process.env.BASE_CASE_NAME) {
  process.env.SAS_E2E_BASE_CASE_NAME = process.env.BASE_CASE_NAME
}

const chromeDesktop = devices['Desktop Chrome']
export default defineConfig<TestOptions>({
  testDir: './',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  maxFailures: process.env.CI ? 3 : 1,
  workers: 2,
  reporter: [
    ['list'],
    ['html', { outputFolder: '../test_results/e2e/report' }],
    ['playwright-ctrf-json-reporter', { outputDir: 'test_results/e2e/ctrf', outputFile: 'ctrf-report.json' }],
  ],
  outputDir: '../test_results/e2e/artefacts',
  timeout: process.env.CI ? 5 * 60 * 1000 : 2 * 60 * 1000,
  use: {
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'local',
      use: {
        ...chromeDesktop,
        baseURL: 'http://localhost:3000',
      },
    },
    {
      name: 'dev',
      use: {
        ...chromeDesktop,
        baseURL: 'https://single-accommodation-service-dev.hmpps.service.justice.gov.uk/',
      },
    },
    {
      name: 'test',
      use: {
        ...chromeDesktop,
        baseURL: 'https://single-accommodation-service-test.hmpps.service.justice.gov.uk/',
      },
    },
  ],
})
