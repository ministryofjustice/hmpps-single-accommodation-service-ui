import { test } from '@playwright/test'
import { AccommodationDetail, AccommodationReferralDto, CaseDto, DutyToReferDto, EligibilityDto } from '@sas/api'
import { login } from '../../testUtils'
import casesApi from '../../mockApis/cases'
import dutyToReferApi from '../../mockApis/dutyToRefer'
import eligibilityApi from '../../mockApis/eligibility'
import ProfileTrackerPage from '../../pages/cases/profileTrackerPage'
import {
  caseFactory,
  referralFactory,
  dutyToReferFactory,
  eligibilityFactory,
  serviceResultFactory,
  accommodationFactory,
} from '../../../server/testutils/factories'

test.describe('Profile Tracker Page', () => {
  const setupStubs = async ({
    crn,
    caseData,
    dutyToRefer,
    eligibility,
    referrals,
    proposedAddresses,
  }: {
    crn: string
    caseData: CaseDto
    dutyToRefer?: DutyToReferDto
    eligibility?: EligibilityDto
    referrals?: AccommodationReferralDto[]
    proposedAddresses?: AccommodationDetail[]
  }) => {
    await casesApi.stubGetCases([caseData])
    await casesApi.stubGetCaseByCrn(crn, caseData)
    await dutyToReferApi.stubGetDutyToReferByCrn(crn, dutyToRefer ? [dutyToRefer] : undefined)
    await eligibilityApi.stubGetEligibilityByCrn(crn, eligibility)
    await casesApi.stubGetReferralHistory(crn, referrals)
    await casesApi.stubGetProposedAddressesByCrn(crn, proposedAddresses)
  }

  test('Should display profile tracker for a specific case', async ({ page }) => {
    const crn = 'X123456'
    const caseData = caseFactory.build({ crn })
    const dutyToRefer = dutyToReferFactory.build({ crn })
    const eligibility = eligibilityFactory.build({
      cas1: serviceResultFactory.build(),
      cas2Hdc: serviceResultFactory.build(),
      cas3: serviceResultFactory.build(),
    })
    const referrals = referralFactory.buildList(3)
    const proposedAddresses = [
      accommodationFactory.proposed().build({ verificationStatus: 'PASSED', nextAccommodationStatus: 'YES' }),
      accommodationFactory.proposed().build({ verificationStatus: 'NOT_CHECKED_YET' }),
      accommodationFactory.proposed().build({ verificationStatus: 'FAILED' }),
    ]

    await setupStubs({ crn, caseData, dutyToRefer, eligibility, referrals, proposedAddresses })
    await login(page)

    await page.getByRole('link', { name: caseData.name }).click()

    const profileTrackerPage = await ProfileTrackerPage.verifyOnPage(page, caseData)

    await profileTrackerPage.shouldShowCaseDetails(caseData)
    await profileTrackerPage.shouldShowDutyToRefer(dutyToRefer)
    await profileTrackerPage.shouldShowEligibility(eligibility)
    await profileTrackerPage.shouldShowProposedAddresses(proposedAddresses)
    await profileTrackerPage.shouldShowReferralHistory(referrals)
  })

  test.describe('accommodation cards', () => {
    const crn = 'X123456'

    test(`should render next and current cards for a confirmed case`, async ({ page }) => {
      const caseData = caseFactory.confirmed().build({ crn })
      await setupStubs({ crn, caseData })
      await login(page)

      const profileTrackerPage = await ProfileTrackerPage.visit(page, caseData)

      await profileTrackerPage.shouldShowNextAccommodationCard(caseData.nextAccommodation)
      await profileTrackerPage.shouldShowCurrentAccommodationCard(caseData.currentAccommodation)
    })

    test(`should render next as alert and current as card for a NFA case`, async ({ page }) => {
      const caseData = caseFactory.noFixedAbodeNext().build({ crn })
      await setupStubs({ crn, caseData })
      await login(page)

      const profileTrackerPage = await ProfileTrackerPage.visit(page, caseData)

      await profileTrackerPage.shouldShowNextAccommodationAlert(caseData.nextAccommodation)
      await profileTrackerPage.shouldShowCurrentAccommodationCard(caseData.currentAccommodation)
    })

    test(`should render only current alert for a currently NFA case`, async ({ page }) => {
      const caseData = caseFactory.noFixedAbodeCurrent().build({ crn })
      await setupStubs({ crn, caseData })
      await login(page)

      const profileTrackerPage = await ProfileTrackerPage.visit(page, caseData)

      await profileTrackerPage.shouldShowCurrentAccommodationAlert(caseData.currentAccommodation)
    })
  })

  test.describe('proposed addresses', () => {
    test('should display a message if there are no proposed addresses at all', async ({ page }) => {
      const crn = 'X123456'
      const caseData = caseFactory.build({ crn })
      await setupStubs({ crn, caseData })
      await login(page)

      const profileTrackerPage = await ProfileTrackerPage.visit(page, caseData)

      await profileTrackerPage.shouldShowProposedAddresses()
    })

    test('should display a message if there are no proposed addresses but some rejected addresses', async ({
      page,
    }) => {
      const crn = 'X123456'
      const caseData = caseFactory.build({ crn })
      const proposedAddresses = [accommodationFactory.proposed().build({ verificationStatus: 'FAILED' })]
      await setupStubs({ crn, caseData, proposedAddresses })
      await login(page)

      const profileTrackerPage = await ProfileTrackerPage.visit(page, caseData)

      await profileTrackerPage.shouldShowProposedAddresses(proposedAddresses)
    })
  })
})
