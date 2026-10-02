/* eslint-disable import/no-extraneous-dependencies,no-console */
import { login as loginDelius } from '@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/login'
import { createOffender } from '@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/offender/create-offender'
import { deleteOffender } from '@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/offender/delete-offender'
import { deliusPerson } from '@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/utils/person'
import {
  buildAddress,
  createAddress,
} from '@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/address/create-address'
import { createCustodialEvent } from '@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/event/create-event'
import {
  createAndBookPrisoner,
  releasePrisoner,
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
import clearNationalSearch from '../steps/clearNationalSearch'
import { expect, test } from '../../e2e/test'
import { TEST_STAFF, TEST_TEAM } from '../fixtures'
import appendToFile from '../utils/appendToFile'

test('Create data for Base Case', async ({ page, requiresOasys }) => {
  await loginDelius(page)

  let nomisId: string | undefined
  let crn: string | undefined
  let failed = false

  try {
    const person = deliusPerson()
    console.log('Creating offender...')
    crn = await createOffender(page, {
      person,
      providerName: TEST_TEAM.provider,
    })
    appendToFile(`BASE_CASE_NAME=${person.firstName} ${person.lastName}`)
    appendToFile(crn, 'CRN.txt')
    console.log('OK \n----------')

    console.log('Creating address...')
    const address = buildAddress('Previous')
    await createAddress(page, crn, address)
    console.log('OK \n----------')

    console.log('Creating custodial event...')
    await createCustodialEvent(page, { crn, allocation: { team: TEST_TEAM } })
    console.log('OK \n----------')

    console.log('Creating booking...')
    const { nomisId: createdNomisId, bookingId } = await createAndBookPrisoner(page, crn, person)
    nomisId = createdNomisId
    appendToFile(nomisId, 'NOMIS.txt')
    console.log('OK \n----------')

    if (process.env.OASYS_USERNAME_BOOKING && requiresOasys) {
      console.log('Creating OASys assessment...')
      await oasysLogin(page, UserType.Booking)
      await createLayer3CompleteAssessment(page, crn, person, 'No')
      await signAndlock(page)
      console.log('OK \n----------')
    }

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
  } catch (error) {
    failed = true
    console.error(`Person generation failed; releasing prisoner ${nomisId}`)
    try {
      if (nomisId) {
        await releasePrisoner(nomisId)
      }
      if (crn) {
        await loginDelius(page)
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
      console.log('OK \n----------')
    } catch (releaseError) {
      console.error(`Failed to release prisoner ${nomisId}:`, releaseError)
    }
    throw error
  }

  if (nomisId && !failed) {
    console.log('Releasing prisoner...')
    await releasePrisoner(nomisId)
    console.log('OK \n----------')
  }
})
