import { test } from '../test'
import { signIn } from '../steps/signIn'
import CaseDetailsPage from '../pages/caseDetailsPage'
import { CasCard } from '../data/casCard'

const statuses: CasCard[] = [
  { crn: 'Y067718', status: 'Not started', action: 'Start application', actionLink: 'redirect' },
  { crn: 'Y076357', status: 'Submitted', submissionInfo: true, action: 'View application', actionLink: 'application' },
  {
    crn: 'Y076809',
    status: 'Not submitted',
    action: 'Continue application',
    actionLink: 'application',
  },
  {
    crn: 'Y076360',
    status: 'More information needed',
    submissionInfo: true,
    action: 'Continue application',
    actionLink: 'application',
  },
  {
    crn: 'Y068099',
    status: 'Withdrawn',
    submissionInfo: true,
    action: 'Start new application',
    actionLink: 'redirect',
  },
  {
    crn: 'Y076679',
    status: 'Awaiting decision',
    submissionInfo: true,
    action: 'View application',
    actionLink: 'application',
  },
  {
    crn: 'Y076363',
    status: 'On waiting list',
    submissionInfo: true,
    action: 'View application',
    actionLink: 'application',
  },
  {
    crn: 'Y076370',
    status: 'Awaiting arrival',
    submissionInfo: true,
    action: 'View application',
    actionLink: 'application',
  },
  {
    crn: 'Y076654',
    status: 'Place offered',
    submissionInfo: true,
    action: 'View application',
    actionLink: 'application',
  },
  {
    crn: 'Y076721',
    status: 'Offer accepted',
    submissionInfo: true,
    action: 'View application',
    actionLink: 'application',
  },
  {
    crn: 'Y076757',
    status: 'Offer declined or withdrawn',
    submissionInfo: true,
    declineReason: 'Applicant bailed to non CAS2 accommodation',
    action: 'Start new application',
    actionLink: 'redirect',
  },
  // {
  //   crn: 'XXXXX',
  //   status: 'Arrived',
  //   submissionInfo: true,
  //   arrivalInfo: true,
  //   action: 'View application',
  //   actionLink: 'application',
  // },
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
      await caseDetailsPage.expectCas2SubmissionInfo()
    }

    // AND I should see the arrival information if available
    if (status.arrivalInfo) {
      await caseDetailsPage.expectArrivalInformation()
    }

    // AND I should see the decline reason if available
    if (status.declineReason) {
      await caseDetailsPage.expectCas2DeclineReason(status.declineReason)
    }

    // WHEN I click the "${status.action}" link
    await caseDetailsPage.clickCas2Link(status.action)

    // THEN I should be redirected correctly
    if (status.actionLink === 'redirect') {
      await caseDetailsPage.expectCas2Redirect()
    } else if (status.actionLink === 'application') {
      await caseDetailsPage.expectExistingApplication()
    }
  })
}
