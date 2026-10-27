import { test } from '../test'
import { signIn } from '../steps/signIn'
import CaseDetailsPage from '../pages/caseDetailsPage'
import { CasCard } from '../data/casCard'

const statuses: CasCard[] = [
  { crn: 'XXXXX', status: 'Not started', action: 'Start application', actionLink: 'redirect' },
  { crn: 'XXXXX', status: 'Submitted', submissionInfo: true, action: 'View application', actionLink: 'application' },
  {
    crn: 'XXXXX',
    status: 'Not submitted',
    submissionInfo: true,
    action: 'Continue application',
    actionLink: 'application',
  },
  {
    crn: 'XXXXX',
    status: 'Information requested',
    submissionInfo: true,
    action: 'View application',
    actionLink: 'application',
  },
  {
    crn: '',
    status: 'Application rejected',
    declineReason: 'Some reason',
    submissionInfo: true,
    action: 'Start new application',
    actionLink: 'redirect',
  },
  {
    crn: 'Y080298',
    status: 'Placement booked',
    expectedArrivalInfo: true,
    action: 'View application',
    actionLink: 'application',
  },
  {
    crn: 'XXXXX',
    status: 'Arrived',
    submissionInfo: true,
    action: 'View application',
    actionLink: 'application',
  },
  {
    crn: 'XXXXX',
    status: 'Not arrived',
    submissionInfo: true,
    action: 'View application',
    actionLink: 'application',
  },
  {
    crn: 'XXXXX',
    status: 'Placement cancelled',
    declineReason: 'Some reason',
    submissionInfo: true,
    action: 'View application',
    actionLink: 'application',
  },
  {
    crn: 'XXXXX',
    status: 'Placement request submitted',
    submissionInfo: true,
    action: 'View application',
    actionLink: 'application',
  },
  {
    crn: 'XXXXX',
    status: 'Placement request rejected',
    submissionInfo: true,
    declineReason: 'Over capacity',
    action: 'Start new application',
    actionLink: 'redirect',
  },
  {
    crn: 'XXXXX',
    status: 'Arrived',
    submissionInfo: true,
    arrivalInfo: true,
    action: 'View application',
    actionLink: 'application',
  },
]

for (const status of statuses) {
  test.skip(`CAS1 status is ${status.status}`, async ({ page, users: { probation: probationUser } }) => {
    // GIVEN I sign in as a probation user
    await signIn(page, probationUser)

    // AND I navigate to a case with that status "${status.status}"
    await page.goto(`/cases/${status.crn}`)

    // WHEN I view the case details page
    const caseDetailsPage = new CaseDetailsPage(page)

    // THEN I should see the CAS1 status as "${status.status}"
    await caseDetailsPage.expectCas1Status(status.status)

    // AND I should see the submission information if available
    if (status.submissionInfo) {
      await caseDetailsPage.expectCas1SubmissionInfo()
    }

    // AND I should see the expected arrival information if available
    if (status.expectedArrivalInfo) {
      await caseDetailsPage.expectCas1ExpectedArrivalInformation()
    }
    // AND I should see the arrival information if available
    if (status.arrivalInfo) {
      await caseDetailsPage.expectArrivalInformation()
    }

    // AND I should see the decline reason if available
    if (status.declineReason) {
      await caseDetailsPage.expectCas1DeclineReason(status.declineReason)
    }

    // WHEN I click the "${status.action}" link
    await caseDetailsPage.clickCas1Link(status.action)

    // THEN I should be redirected correctly
    if (status.actionLink === 'redirect') {
      await caseDetailsPage.expectCas1Redirect()
    } else if (status.actionLink === 'application') {
      await caseDetailsPage.expectExistingApplication()
    }
  })
}
