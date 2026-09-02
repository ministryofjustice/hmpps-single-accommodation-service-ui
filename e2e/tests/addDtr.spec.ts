import { test } from '../test'
import { signIn } from '../steps/signIn'
import CaseDetailsPage from '../pages/caseDetailsPage'
import AddDtrReferralDetailsPage from '../pages/addDtrReferralDetailsPage'
import ViewDtrReferralDetailsPage from '../pages/viewDtrReferralDetailsPage'
import { AddDtrOutcomePage, DtrOutcome } from '../pages/addDtrOutcomePage'
import { getCaseLink } from '../steps/getCaseLink'
import { DtrStatus } from '../data/statuses'

test('Previous DTR referral is withdrawn when a new referral is added', async ({
  page,
  users: { probation: probationUser },
  cases: { BASE_CASE },
}) => {
  // GIVEN I sign in as a probation user
  await signIn(page, probationUser)

  // AND I open the relevant case
  const { caseLink } = await getCaseLink(page, BASE_CASE)
  await caseLink.click()

  const caseDetailsPage = new CaseDetailsPage(page)
  const addDtrReferralDetailsPage = new AddDtrReferralDetailsPage(page)
  const viewDtrReferralDetailsPage = new ViewDtrReferralDetailsPage(page)
  const addDtrOutcomePage = new AddDtrOutcomePage(page)

  // THEN the DTR referral has not been started
  await caseDetailsPage.expectDtrStatus(DtrStatus.NOT_STARTED)

  // WHEN I choose to add the first DTR referral
  await caseDetailsPage.clickAddDtrReferralDetails()

  // THEN I am taken to the Add DTR referral details page
  await addDtrReferralDetailsPage.expectPageToBeDisplayed()

  // WHEN I enter the first referral details
  await addDtrReferralDetailsPage.enterSubmissionDate({
    day: '15',
    month: '7',
    year: '2026',
  })
  await addDtrReferralDetailsPage.selectLocalAuthority('Aberdeen City')

  // AND I save the referral
  await addDtrReferralDetailsPage.saveAndContinue()

  // THEN the first referral is shown as submitted
  await caseDetailsPage.expectDtrStatus(DtrStatus.SUBMITTED)
  await caseDetailsPage.expectDtrViewReferralLink()

  // WHEN I open the first referral
  await caseDetailsPage.clickViewDtrReferral()

  // THEN the referral details page is displayed
  await viewDtrReferralDetailsPage.expectPageToBeDisplayed()

  // WHEN I choose to add a new referral
  await viewDtrReferralDetailsPage.clickAddNewReferral()

  // THEN I am taken to the Add DTR referral details page
  await addDtrReferralDetailsPage.expectPageToBeDisplayed()

  // WHEN I enter the second referral details
  await addDtrReferralDetailsPage.enterSubmissionDate({
    day: '20',
    month: '7',
    year: '2026',
  })
  await addDtrReferralDetailsPage.selectLocalAuthority('Aberdeen City')

  // AND I save the second referral
  await addDtrReferralDetailsPage.saveAndContinue()

  // THEN the second referral is shown as submitted
  await caseDetailsPage.expectDtrStatus(DtrStatus.SUBMITTED)
  await caseDetailsPage.expectDtrViewReferralLink()

  // WHEN I open the second referral
  await caseDetailsPage.clickViewDtrReferral()

  // THEN the referral details page is displayed
  await viewDtrReferralDetailsPage.expectPageToBeDisplayed()

  // WHEN I choose to add an outcome
  await viewDtrReferralDetailsPage.clickAddOutcome()

  // THEN the Add DTR outcome page is displayed
  await addDtrOutcomePage.expectPageToBeDisplayed()

  // WHEN I add an accepted outcome
  const outcome: DtrOutcome = 'Yes, it was accepted on prevention and relief duty'
  await addDtrOutcomePage.selectOutcome(outcome)
  await addDtrOutcomePage.saveAndContinue()

  // THEN the outcome confirmation is displayed
  await viewDtrReferralDetailsPage.expectPageToBeDisplayed()
  await viewDtrReferralDetailsPage.expectOutcomeAddedBanner()

  // WHEN I return to the case details page
  await viewDtrReferralDetailsPage.returnToCaseDetails()

  // THEN the second referral is displayed as accepted
  await caseDetailsPage.expectDtrStatus(DtrStatus.ACCEPTED)
  await caseDetailsPage.expectDtrViewReferralLink()

  // AND the first referral appears in referral history as withdrawn
  await caseDetailsPage.expectDtrReferralInHistory({
    referredBy: 'You (SAS TestUserE2E)',
    status: DtrStatus.WITHDRAWN,
    submissionDate: '15 July 2026',
    localAuthority: 'Aberdeen City',
    reason: 'Replaced by a new referral',
  })
})
