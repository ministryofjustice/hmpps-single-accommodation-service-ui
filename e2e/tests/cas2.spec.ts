import { test } from '../test'
import { signIn } from '../steps/signIn'
import CaseDetailsPage from '../pages/caseDetailsPage'

type Cas2Card = {
  status: string
  crn: string
  submissionInfo?: boolean
  action: string
  actionLink: 'redirect' | 'application'
  declineReason?: string
  arrivalInfo?: boolean
}

const statuses: Cas2Card[] = [
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
    status: 'More information needed',
    submissionInfo: true,
    action: 'View application',
    actionLink: 'application',
  },
  { crn: 'XXXXX', status: 'Withdrawn', submissionInfo: true, action: 'Start new application', actionLink: 'redirect' },
  {
    crn: 'XXXXX',
    status: 'Awaiting decision',
    submissionInfo: true,
    action: 'View application',
    actionLink: 'application',
  },
  {
    crn: 'XXXXX',
    status: 'On waiting list',
    submissionInfo: true,
    action: 'View application',
    actionLink: 'application',
  },
  {
    crn: 'XXXXX',
    status: 'Awaiting arrival',
    submissionInfo: true,
    action: 'View application',
    actionLink: 'application',
  },
  {
    crn: 'XXXXX',
    status: 'Place offered',
    submissionInfo: true,
    action: 'View application',
    actionLink: 'application',
  },
  {
    crn: 'XXXXX',
    status: 'Offer accepted',
    submissionInfo: true,
    action: 'View application',
    actionLink: 'application',
  },
  {
    crn: 'XXXXX',
    status: 'Offer declined or withdrawn',
    submissionInfo: true,
    declineReason: 'Offer declined by applicant',
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
  test.skip(`CAS2 status is ${status.status}`, async ({ page, users: { probation: probationUser } }) => {
    // GIVEN I sign in as a probation user
    await signIn(page, probationUser)

    // AND I navigate to a case with that status "${status.status}"
    await page.goto(`/cases/${status.crn}`)

    // WHEN I view the case details page
    const caseDetailsPage = new CaseDetailsPage(page)

    // THEN I should see the CAS2 status as "${status.status}"
    await caseDetailsPage.expectCas2Status(status.status)

    // AND I should see the submission information if available
    if (status.submissionInfo) {
      await caseDetailsPage.expectSubmissionInfo()
    }

    // AND I should see the arrival information if available
    if (status.arrivalInfo) {
      await caseDetailsPage.expectArrivalInformation()
    }

    // AND I should see the decline reason if available
    if (status.declineReason) {
      await caseDetailsPage.expectDeclineReason(status.declineReason)
    }

    // WHEN I click the "${status.action}" link
    await caseDetailsPage.clickCas2Link(status.action)

    // THEN I should be redirected correctly
    if (status.actionLink === 'redirect') {
      await caseDetailsPage.expectCas2Redirect()
    } else if (status.actionLink === 'application') {
      await caseDetailsPage.expectCas2Application()
    }
  })
}
