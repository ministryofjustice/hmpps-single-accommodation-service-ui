import { defineConfig, PlaywrightTestConfig } from '@playwright/test'
import { TestOptions } from '@sas/e2e'
import { setupConfig } from './setup.config'

const teardownConfig: PlaywrightTestConfig = {
  ...setupConfig,
  testDir: './teardown',
}

export default defineConfig<TestOptions>(teardownConfig)
