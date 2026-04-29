import { expect, test } from '@playwright/test'
import {
  AccommodationDetail,
  AccommodationReferralDto,
  AccommodationSummaryDto,
  CaseDto,
  DutyToReferDto,
  EligibilityDto,
} from '@sas/api'
import { login } from '../../testUtils'
import casesApi from '../../mockApis/cases'
import dutyToReferApi from '../../mockApis/dutyToRefer'
import eligibilityApi from '../../mockApis/eligibility'
import proposedAddressesApi from '../../mockApis/proposedAddresses'
import accommodationApi from '../../mockApis/accommodation'
import ProfileTrackerPage from '../../pages/cases/profileTrackerPage'
import {
  caseFactory,
  referralFactory,
  dutyToReferFactory,
  eligibilityFactory,
  serviceResultFactory,
  accommodationFactory,
  accommodationSummaryFactory,
} from '../../../server/testutils/factories'

test.describe('Profile Tracker Page', () => {
  const setupStubs = async ({
    crn,
    caseData,
    dutyToRefer,
    eligibility,
    referrals,
    proposedAddresses,
    currentAccommodation,
    nextAccommodation,
    accommodationHistory,
  }: {
    crn: string
    caseData: CaseDto
    dutyToRefer?: DutyToReferDto
    eligibility?: EligibilityDto
    referrals?: AccommodationReferralDto[]
    proposedAddresses?: AccommodationDetail[]
    currentAccommodation?: AccommodationSummaryDto
    nextAccommodation?: AccommodationSummaryDto
    accommodationHistory?: AccommodationSummaryDto[]
  }) => {
    await casesApi.stubGetCases([caseData])
    await casesApi.stubGetCaseByCrn(crn, caseData)
    await dutyToReferApi.stubGetCurrentDtr(crn, dutyToRefer || undefined)
    await eligibilityApi.stubGetEligibilityByCrn(crn, eligibility)
    await casesApi.stubGetReferralHistory(crn, referrals)
    await proposedAddressesApi.stubGetProposedAddressesByCrn(crn, proposedAddresses)
    await accommodationApi.stubGetCurrentAccommodation(crn, currentAccommodation)
    await accommodationApi.stubGetNextAccommodation(crn, nextAccommodation)
    await accommodationApi.stubGetAccommodationHistory(crn, accommodationHistory)
  }

  test('Should display profile tracker for a specific case', async ({ page }) => {
    const crn = 'X123456'
    const caseData = caseFactory.build({ crn })
    const dutyToRefer = dutyToReferFactory.build({ crn })
    const eligibility = eligibilityFactory.build({
      cas1: serviceResultFactory.build(),
      cas3: serviceResultFactory.build(),
    })
    const referrals = referralFactory.buildList(3)
    const proposedAddresses = [
      accommodationFactory.proposed().build({ verificationStatus: 'PASSED', nextAccommodationStatus: 'YES' }),
      accommodationFactory.proposed().build({ verificationStatus: 'NOT_CHECKED_YET' }),
      accommodationFactory.proposed().build({ verificationStatus: 'FAILED' }),
    ]
    const accommodationHistory = accommodationSummaryFactory.buildListSequential(5)

    await setupStubs({ crn, caseData, dutyToRefer, eligibility, referrals, proposedAddresses, accommodationHistory })
    await login(page)

    await page.getByRole('link', { name: caseData.name }).click()

    const profileTrackerPage = await ProfileTrackerPage.verifyOnPage(page, caseData)

    await profileTrackerPage.shouldShowCaseDetails(caseData)
    await profileTrackerPage.shouldShowDutyToRefer(dutyToRefer)
    await profileTrackerPage.shouldShowEligibility(eligibility)
    await profileTrackerPage.shouldShowNextActions(eligibility.caseActions)
    await profileTrackerPage.shouldShowProposedAddresses(proposedAddresses)
    await profileTrackerPage.shouldShowReferralHistory(referrals)
    await profileTrackerPage.shouldShowAccommodationHistory(accommodationHistory)
  })

  test('Shows a 404 if the CRN is not found', async ({ page }) => {
    const crn = 'X123456'
    const caseData = caseFactory.build({ crn })
    await setupStubs({ crn, caseData })

    await login(page)

    await page.goto('/cases/X999999')

    await expect(page.locator('h1', { hasText: 'Not found' })).toBeVisible()
  })

  test.describe('accommodation cards', () => {
    const crn = 'X123456'

    test(`should render next and current cards for a confirmed case`, async ({ page }) => {
      const caseData = caseFactory.confirmed().build({ crn })
      const currentAccommodation = accommodationSummaryFactory.current().build()
      const nextAccommodation = accommodationSummaryFactory.next().build()
      await setupStubs({ crn, caseData, currentAccommodation, nextAccommodation })
      await login(page)

      const profileTrackerPage = await ProfileTrackerPage.visit(page, caseData)

      await profileTrackerPage.shouldShowNextAccommodationCard(nextAccommodation)
      await profileTrackerPage.shouldShowCurrentAccommodationCard(currentAccommodation)
    })

    test(`should render only current accommodation for a NFA next case`, async ({ page }) => {
      const caseData = caseFactory.noFixedAbodeNext().build({ crn })
      const currentAccommodation = accommodationSummaryFactory.current().build()
      await setupStubs({ crn, caseData, currentAccommodation })
      await login(page)

      const profileTrackerPage = await ProfileTrackerPage.visit(page, caseData)

      await profileTrackerPage.shouldNotShowNextAccommodationCard()
      await profileTrackerPage.shouldShowCurrentAccommodationCard(currentAccommodation)
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
