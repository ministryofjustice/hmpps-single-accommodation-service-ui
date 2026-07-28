import { defineConfig, PlaywrightTestConfig } from '@playwright/test'
import { TestOptions } from '@sas/e2e'
import { config } from 'dotenv'
import { setupConfig } from './setup.config'

config({
  path: '.env.e2e.teardown',
  override: true,
})

const teardownConfig: PlaywrightTestConfig = {
  ...setupConfig,
  testDir: './teardown',
}

export default defineConfig<TestOptions>(teardownConfig)
