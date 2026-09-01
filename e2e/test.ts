import { test as base, expect } from '@playwright/test'
import { TestOptions } from '@sas/e2e'

export const test = base.extend<TestOptions>({
  users: {
    probation: {
      username: process.env.SAS_E2E_PROBATION_USER_USERNAME,
      password: process.env.SAS_E2E_PROBATION_USER_PASSWORD,
    },
  },
  cases: {
    BASE_CASE: {
      name: process.env.SAS_E2E_BASE_CASE_NAME,
    },
  },
})

export { expect }
