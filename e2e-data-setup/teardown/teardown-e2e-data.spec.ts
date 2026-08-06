/* eslint-disable import/no-extraneous-dependencies,no-console */
import { expect, test } from '@playwright/test'
import { join } from 'node:path'
import { readFileSync } from 'fs'
import { deleteOffender } from '@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/offender/delete-offender'
import { login as loginDelius } from '@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/login'
import { releasePrisoner } from '@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/api/dps/prison-api'
import clearNationalSearch from '../steps/clearNationalSearch'

const DATA_DIR = join(process.cwd(), 'tmp')

const readLines = (filename: string) => {
  return readFileSync(join(DATA_DIR, filename))
    .toString()
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
}

test('Teardown E2E data', async ({ page }) => {
  const crns: string[] = []
  try {
    crns.push(...readLines('CRN.txt'))
  } catch (e) {
    console.error(`Could not read CRN file: ${e}`)
  }

  const nomisIds: string[] = []
  try {
    nomisIds.push(...readLines('NOMIS.txt'))
  } catch (e) {
    console.error(`Could not read NOMIS IDs file: ${e}`)
  }

  if (crns.length) {
    await loginDelius(page)

    for await (const crn of crns) {
      try {
        await clearNationalSearch(page)
        await deleteOffender(page, crn)
        await expect(page).toHaveTitle(/National Search/)
        await expect(page.getByText('No records found.')).toBeVisible()

        console.log(`Deleted offender with CRN ${crn}`)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        console.error(`Could not delete offender with CRN ${crn}`)
      }
    }
  }

  if (nomisIds.length) {
    for await (const nomisId of nomisIds) {
      try {
        await releasePrisoner(nomisId)
        console.log(`Offender with NOMIS ID ${nomisId} marked as released`)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        console.error(`Could not release prisoner with NOMIS ID ${nomisId}`)
      }
    }
  }
})
