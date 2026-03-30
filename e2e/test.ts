import { test as base } from '@playwright/test'
import { TestOptions } from '@sas/e2e'

// eslint-disable-next-line import/prefer-default-export
export const test = base.extend<TestOptions>({
  users: {
    probation: {
      username: process.env.SAS_E2E_PROBATION_USER_USERNAME,
      password: process.env.SAS_E2E_PROBATION_USER_PASSWORD,
    },
  },
})
