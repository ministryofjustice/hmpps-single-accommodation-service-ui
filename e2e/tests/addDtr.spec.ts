import { test } from '../test'
import { signIn } from '../steps/signIn'
import CaseDetailsPage from '../pages/caseDetailsPage'
import AddDtrReferralDetailsPage from '../pages/addDtrReferralDetailsPage'
import ViewDtrReferralDetailsPage from '../pages/viewDtrReferralDetailsPage'
import { AddDtrOutcomePage, DtrOutcome } from '../pages/addDtrOutcomePage'
import { getCaseLink } from '../steps/getCaseLink'

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
  await caseDetailsPage.expectDtrStatus('Not started')

  // WHEN I add the first DTR referral
  await caseDetailsPage.clickAddDtrReferralDetails()

  await addDtrReferralDetailsPage.expectPageToBeDisplayed()

  await addDtrReferralDetailsPage.enterSubmissionDate({
    day: '15',
    month: '7',
    year: '2026',
  })

  await addDtrReferralDetailsPage.selectLocalAuthority('Aberdeen City')

  await addDtrReferralDetailsPage.saveAndContinue()

  // THEN the first referral is shown as submitted
  await caseDetailsPage.expectDtrStatus('Submitted')
  await caseDetailsPage.expectDtrViewReferralLink()

  // WHEN I open the first referral
  await caseDetailsPage.clickViewDtrReferral()

  await viewDtrReferralDetailsPage.expectPageToBeDisplayed()

  // AND I choose to add a new referral
  await viewDtrReferralDetailsPage.clickAddNewReferral()

  // THEN I am taken to the Add DTR referral details page
  await addDtrReferralDetailsPage.expectPageToBeDisplayed()

  // WHEN I submit the second referral
  await addDtrReferralDetailsPage.enterSubmissionDate({
    day: '20',
    month: '7',
    year: '2026',
  })

  await addDtrReferralDetailsPage.selectLocalAuthority('Aberdeen City')

  await addDtrReferralDetailsPage.saveAndContinue()

  // THEN the second referral is shown as submitted
  await caseDetailsPage.expectDtrStatus('Submitted')
  await caseDetailsPage.expectDtrViewReferralLink()

  // WHEN I open the second referral
  await caseDetailsPage.clickViewDtrReferral()

  await viewDtrReferralDetailsPage.expectPageToBeDisplayed()

  // AND I add an outcome to the second referral
  await viewDtrReferralDetailsPage.clickAddOutcome()

  await addDtrOutcomePage.expectPageToBeDisplayed()

  const outcome: DtrOutcome = 'Yes, it was accepted on prevention and relief duty'

  await addDtrOutcomePage.selectOutcome(outcome)
  await addDtrOutcomePage.saveAndContinue()

  // THEN the outcome confirmation is displayed
  await viewDtrReferralDetailsPage.expectPageToBeDisplayed()
  await viewDtrReferralDetailsPage.expectOutcomeAddedBanner()

  // WHEN I return to the case details page
  await viewDtrReferralDetailsPage.returnToCaseDetails()

  // THEN the second referral is displayed in the DTR card
  await caseDetailsPage.expectDtrStatus('Accepted')
  await caseDetailsPage.expectDtrViewReferralLink()

  // AND the first referral appears in referral history as withdrawn
  await caseDetailsPage.expectDtrReferralInHistory({
    referredBy: 'You (SAS TestUserE2E)',
    status: 'Withdrawn',
    submissionDate: '15 July 2026',
    localAuthority: 'Aberdeen City',
    reason: 'Replaced by a new referral',
  })
})
