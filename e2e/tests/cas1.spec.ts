import { test } from '../test'
import { signIn } from '../steps/signIn'
import CaseDetailsPage from '../pages/caseDetailsPage'
import { CasCard } from '../data/casCard'

const statuses: CasCard[] = [
  { crn: 'Y086007', status: 'Not started', action: 'Start application', actionLink: 'redirect' },
  { crn: 'Y082779', status: 'Submitted', submissionInfo: true, action: 'View application', actionLink: 'application' },
  {
    crn: 'Y076210',
    status: 'Not submitted',
    submissionInfo: true,
    action: 'Continue application',
    actionLink: 'application',
  },
  {
    crn: 'Y085823',
    status: 'Information requested',
    submissionInfo: true,
    action: 'View application',
    actionLink: 'application',
  },
  {
    crn: 'Y080265',
    status: 'Application rejected',
    declineReason: 'Reject, not suitable for an AP: AP not necessary or proportionate to manage the identified risk',
    submissionInfo: true,
    action: 'Start new application',
    actionLink: 'redirect',
  },
  {
    crn: 'Y080298',
    status: 'Placement request not started',
    submissionInfo: true,
    action: 'Create placement request',
    actionLink: 'application',
  },
  {
    crn: 'Y085881',
    status: 'Not arrived',
    notArrivedInfo: true,
    action: 'Create new placement request',
    actionLink: 'application',
  },
  {
    crn: 'Y006208',
    status: 'Placement request submitted',
    placementRequestSubmittedInfo: true,
    action: 'View application',
    actionLink: 'application',
  },
  {
    crn: 'Y085882',
    status: 'Placement request withdrawn',
    placementRequestSubmittedInfo: true,
    declineReason: 'The request was a duplicate',
    declineReasonLabel: 'Withdrawal reason',
    action: 'Create new placement request',
    actionLink: 'application',
  },
  {
    crn: 'Y085890',
    status: 'Arrived',
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
      await caseDetailsPage.expectCas1ArrivalInformation()
    }

    // AND I should see the not-arrived information if available
    if (status.notArrivedInfo) {
      await caseDetailsPage.expectCas1NotArrivedInformation()
    }

    // AND I should see the placement request submitted information if available
    if (status.placementRequestSubmittedInfo) {
      await caseDetailsPage.expectCas1PlacementRequestSubmittedInformation()
    }

    // AND I should see the decline reason if available
    if (status.declineReason) {
      await caseDetailsPage.expectCas1DeclineReason(status.declineReason, status.declineReasonLabel)
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
