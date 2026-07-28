/* eslint-disable import/no-extraneous-dependencies,no-console */
import { test } from '@playwright/test'
import { join } from 'node:path'
import { readFileSync } from 'fs'
import { deleteOffender } from '@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/offender/delete-offender'
import { login as loginDelius } from '@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/login'
import { releasePrisoner } from '@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/api/dps/prison-api'

test('Teardown E2E data', async ({ page }) => {
  const DATA_DIR = join(process.cwd(), 'tmp')

  const crns: string[] = []
  try {
    crns.push(...readFileSync(join(DATA_DIR, 'CRN.txt')).toString().split('\n'))
  } catch (e) {
    console.error(`Could not read CRN file: ${e}`)
  }

  const nomisIds: string[] = []
  try {
    nomisIds.push(...readFileSync(join(DATA_DIR, 'NOMIS.txt')).toString().split('\n'))
  } catch (e) {
    console.error(`Could not read NOMIS IDs file: ${e}`)
  }

  if (crns.length) {
    await loginDelius(page)

    for await (const crn of crns) {
      try {
        await deleteOffender(page, crn)
      } catch (e) {
        console.error(`Could not delete offender with CRN ${crn}: ${e}`)
      }
    }
  }

  if (nomisIds.length) {
    for await (const nomisId of nomisIds) {
      try {
        await releasePrisoner(page, nomisId)
      } catch (e) {
        console.error(`Could not release prisoner with NOMIS ID ${nomisId}: ${e}`)
      }
    }
  }
})
