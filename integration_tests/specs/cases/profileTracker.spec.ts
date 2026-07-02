import { expect, test } from '@playwright/test'
import { login } from '../../testUtils'
import casesApi from '../../mockApis/cases'
import eligibilityApi from '../../mockApis/eligibility'
import accommodationApi from '../../mockApis/accommodation'
import ProfileTrackerPage from '../../pages/cases/profileTrackerPage'
import {
  caseFactory,
  referralFactory,
  dutyToReferFactory,
  eligibilityFactory,
  serviceResultFactory,
  accommodationSummaryFactory,
  proposedAccommodationFactory,
  crsServiceResultFactory,
} from '../../../server/testutils/factories'
import { stubProfilePage } from '../../helpers/profilePage'
import { stubCaseListPage } from '../../helpers/caseListPage'

test.describe('Profile Tracker Page', () => {
  test('Should display profile tracker for a specific case', async ({ page }) => {
    const crn = 'X123456'
    const caseData = caseFactory.build({ crn })
    const dutyToRefer = dutyToReferFactory.build({ crn })
    const eligibility = eligibilityFactory.build({
      crn,
      dtr: { serviceResult: serviceResultFactory.build(), submission: dutyToRefer.submission },
      crs: crsServiceResultFactory.build(),
      cas1: { serviceResult: serviceResultFactory.build() },
      cas3: { serviceResult: serviceResultFactory.build() },
    })
    const referrals = referralFactory.buildReferralHistoryList(3)
    const proposedAddresses = [
      proposedAccommodationFactory.build({ verificationStatus: 'PASSED', nextAccommodationStatus: 'YES' }),
      proposedAccommodationFactory.build({ verificationStatus: 'NOT_CHECKED_YET' }),
      proposedAccommodationFactory.build({ verificationStatus: 'FAILED' }),
    ]
    const accommodationHistory = accommodationSummaryFactory.buildListSequential(5)

    await stubCaseListPage([caseData])
    await stubProfilePage({ crn, caseData, eligibility, referrals, proposedAddresses, accommodationHistory })

    // WHEN I sign in
    await login(page)

    // AND I click on the case name
    await page.getByRole('link', { name: caseData.name }).click()

    // THEN I should see the profile tracker page
    const profileTrackerPage = await ProfileTrackerPage.verifyOnPage(page, caseData)

    await profileTrackerPage.shouldShowCaseDetails(caseData)
    await profileTrackerPage.shouldShowEligibility(eligibility)
    await profileTrackerPage.shouldShowNextActions(eligibility.caseActions)
    await profileTrackerPage.shouldShowProposedAddresses(proposedAddresses)
    await profileTrackerPage.shouldShowReferralHistory(referrals)
    await profileTrackerPage.shouldShowAccommodationHistory(accommodationHistory)
  })

  test('should display the profile tracker for a case with LAO flag', async ({ page }) => {
    const crn = 'X123456'
    const caseData = caseFactory.build({ crn, limitedAccess: true })

    await stubCaseListPage([caseData])
    await stubProfilePage({ crn, caseData })

    // WHEN I sign in
    await login(page)

    // AND I click on the case name
    await page.getByRole('link', { name: caseData.name }).click()

    // THEN I should see the profile tracker page
    const profileTrackerPage = await ProfileTrackerPage.verifyOnPage(page, caseData)

    await profileTrackerPage.shouldShowCaseDetails(caseData)
  })

  test('Shows a 404 if the CRN is not found', async ({ page }) => {
    const crn = 'X123456'
    const caseData = caseFactory.build({ crn })

    await stubCaseListPage([caseData])
    await casesApi.stubGetCaseByCrn404('X999999')

    // WHEN I sign in
    await login(page)

    // AND I visit the URL for an unknown CRN
    await page.goto('/cases/X999999')

    // THEN I should see a 404 page
    await expect(page.locator('h1', { hasText: 'Not found' })).toBeVisible()
  })

  test('Shows warnings if the API had upstream failures', async ({ page }) => {
    const crn = 'X123456'
    const caseData = caseFactory.build({ crn, userAccess: 'FULL' })

    await stubCaseListPage([caseData])
    await stubProfilePage({ crn, caseData })

    await accommodationApi.stubGetAccommodationHistoryUpstreamFailure(crn)
    await casesApi.stubGetReferralHistoryUpstreamFailure(crn)
    await eligibilityApi.stubGetEligibilityByCrnUpstreamFailure(crn)

    // WHEN I sign in
    await login(page)

    // AND I click on the case name
    await page.getByRole('link', { name: caseData.name }).click()

    // THEN I should see the profile tracker page
    const profileTrackerPage = await ProfileTrackerPage.verifyOnPage(page, caseData)

    // AND I should see the upstream failure warnings
    await profileTrackerPage.shouldShowApiErrors([
      'Next actions',
      'Accommodation referrals',
      'Referral history',
      'Accommodation history',
    ])
  })

  test.describe('accommodation cards', () => {
    const crn = 'X123456'

    test(`should render next and current cards for a confirmed case`, async ({ page }) => {
      const caseData = caseFactory.confirmed().build({ crn })
      const currentAccommodation = accommodationSummaryFactory.current().build()
      const nextAccommodation = accommodationSummaryFactory.next().build()

      await stubCaseListPage([caseData])
      await stubProfilePage({ crn, caseData, currentAccommodation, nextAccommodation })

      // WHEN I sign in
      await login(page)

      // AND I visit the profile tracker page
      const profileTrackerPage = await ProfileTrackerPage.visit(page, caseData)

      // THEN I should see the correct accommodation cards
      await profileTrackerPage.shouldShowNextAccommodationCard(nextAccommodation)
      await profileTrackerPage.shouldShowCurrentAccommodationCard(currentAccommodation)
      await profileTrackerPage.shouldNotShowNoFixedAbodeAlert()
    })

    test(`should render current accommodation card and NFA alert for a case with risk of no fixed abode`, async ({
      page,
    }) => {
      const caseData = caseFactory.riskOfNfa().build({ crn })
      const currentAccommodation = accommodationSummaryFactory.current().build()

      await stubCaseListPage([caseData])
      await stubProfilePage({ crn, caseData, currentAccommodation })

      // WHEN I sign in
      await login(page)

      // AND I visit the profile tracker page
      const profileTrackerPage = await ProfileTrackerPage.visit(page, caseData)

      // THEN I should see the correct accommodation cards
      await profileTrackerPage.shouldNotShowNextAccommodationCard()
      await profileTrackerPage.shouldShowCurrentAccommodationCard(currentAccommodation)
      await profileTrackerPage.shouldShowNoFixedAbodeAlert(caseData, currentAccommodation)
    })

    test(`should render no accommodation cards and NFA alert for a case with no fixed abode`, async ({ page }) => {
      const caseData = caseFactory.nfa().build({ crn })

      await stubCaseListPage([caseData])
      await stubProfilePage({ crn, caseData })

      // WHEN I sign in
      await login(page)

      // AND I visit the profile tracker page
      const profileTrackerPage = await ProfileTrackerPage.visit(page, caseData)

      // THEN I should see the correct accommodation cards
      await profileTrackerPage.shouldNotShowCurrentAccommodationCard()
      await profileTrackerPage.shouldNotShowNextAccommodationCard()
      await profileTrackerPage.shouldShowNoFixedAbodeAlert(caseData)
    })
  })

  test.describe('proposed addresses', () => {
    test('should display a message if there are no proposed addresses at all', async ({ page }) => {
      const crn = 'X123456'
      const caseData = caseFactory.build({ crn })

      await stubCaseListPage([caseData])
      await stubProfilePage({ crn, caseData })

      // WHEN I sign in
      await login(page)

      // AND I visit the profile tracker page
      const profileTrackerPage = await ProfileTrackerPage.visit(page, caseData)

      // THEN I should see the correct proposed addresses cards
      await profileTrackerPage.shouldShowProposedAddresses()
    })

    test('should display a message if there are no proposed addresses but some rejected addresses', async ({
      page,
    }) => {
      const crn = 'X123456'
      const caseData = caseFactory.build({ crn })
      const proposedAddresses = [proposedAccommodationFactory.build({ verificationStatus: 'FAILED' })]

      await stubCaseListPage([caseData])
      await stubProfilePage({ crn, caseData, proposedAddresses })

      // WHEN I sign in
      await login(page)

      // AND I visit the profile tracker page
      const profileTrackerPage = await ProfileTrackerPage.visit(page, caseData)

      // THEN I should see the correct proposed addresses cards
      await profileTrackerPage.shouldShowProposedAddresses(proposedAddresses)
    })
  })
})
