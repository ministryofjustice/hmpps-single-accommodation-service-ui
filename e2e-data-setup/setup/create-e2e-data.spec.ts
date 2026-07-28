/* eslint-disable import/no-extraneous-dependencies,no-console */
import { test } from '@playwright/test'
import { login as loginDelius } from '@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/login'
import { createOffender } from '@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/offender/create-offender'
import { deliusPerson } from '@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/utils/person'
import { createCustodialEvent } from '@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/event/create-event'
import {
  createAndBookPrisoner,
  updateCustodyDates,
} from '@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/api/dps/prison-api'
import {
  login as oasysLogin,
  UserType,
} from '@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/oasys/login'
import { createLayer3CompleteAssessment } from '@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/oasys/layer3-assessment/create-layer3-assessment/create-layer3-without-needs'
import { signAndlock } from '@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/oasys/layer3-assessment/sign-and-lock'
import { internalTransfer } from '@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/transfer/internal-transfer'
import {
  formatDate,
  NextMonth,
} from '@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/utils/date-time'
import { TEST_STAFF, TEST_TEAM } from '../fixtures'
import appendToFile from '../utils/appendToFile'

test('Create data for Base Case', async ({ page }) => {
  await loginDelius(page)

  const person = deliusPerson()
  console.log('Creating offender...')
  const crn: string = await createOffender(page, {
    person,
    providerName: TEST_TEAM.provider,
  })
  appendToFile(`BASE_CASE_NAME=${person.firstName} ${person.lastName}`)
  appendToFile(crn, 'CRN.txt')
  console.log('OK \n----------')

  console.log('Creating custodial event...')
  await createCustodialEvent(page, { crn, allocation: { team: TEST_TEAM } })
  console.log('OK \n----------')

  console.log('Creating booking...')
  const { nomisId, bookingId } = await createAndBookPrisoner(page, crn, person)
  appendToFile(nomisId, 'NOMIS.txt')
  console.log('OK \n----------')

  console.log('Creating OASys assessment...')
  await oasysLogin(page, UserType.Booking)
  await createLayer3CompleteAssessment(page, crn, person, 'Yes')
  await signAndlock(page)
  console.log('OK \n----------')

  console.log('Updating custody dates...')
  await updateCustodyDates(bookingId, { conditionalReleaseDate: formatDate(NextMonth.toJSDate(), 'yyyy-MM-dd') })
  console.log('OK \n----------')

  console.log('Assigning case to singleAccommodationTestUser...')
  await loginDelius(page)
  await internalTransfer(page, {
    crn,
    allocation: { staff: TEST_STAFF, team: TEST_TEAM },
  })
  console.log('OK \n----------')
})
