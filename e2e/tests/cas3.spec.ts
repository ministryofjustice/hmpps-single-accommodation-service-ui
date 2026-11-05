import { test } from '../test'
import { signIn } from '../steps/signIn'
import CaseDetailsPage from '../pages/caseDetailsPage'
import { CasCard } from '../data/casCard'

const statuses: CasCard[] = [
  {
    crn: 'Y087614',
    status: 'Cannot start yet',
    ineligibleInfo: 'You need to submit a CRS accommodation referral before you can make a CAS3 referral.',
  },
  {
    crn: 'Y087594',
    status: 'Not submitted',
    submissionInfo: true,
    action: 'Continue referral',
    actionLink: 'referral',
  },
  {
    crn: 'Y087615',
    status: 'Not started',
    action: 'Start referral',
    actionLink: 'referral',
  },
  {
    crn: 'Y078048',
    status: 'Submitted',
    submissionInfo: true,
    action: 'View referral',
    actionLink: 'referral',
  },
  {
    crn: 'Y087153',
    status: 'Rejected',
    declineReason: 'CAS2 alternative accommodation provided',
    submissionInfo: true,
    action: 'Start new referral',
    actionLink: 'referral',
  },
  {
    crn: 'Y087159',
    status: 'Bedspace offered',
    bedspaceOffered: true,
    action: 'View referral',
    actionLink: 'referral',
  },
  {
    crn: 'Y087339',
    status: 'Booking confirmed',
    bookingInfo: true,
    action: 'View referral',
    actionLink: 'referral',
  },
  {
    crn: 'Y087174',
    status: 'Booking cancelled',
    cancellationReason: 'Other alternative accommodation provided (e.g. friends or family)',
    action: 'View referral',
    actionLink: 'referral',
  },
  {
    crn: 'Y077925',
    status: 'Arrived',
    arrivalInfo: true,
    action: 'View referral',
    actionLink: 'referral',
  },
]

for (const status of statuses) {
  test(`CAS3 status is ${status.status}`, async ({ page, users: { probation: probationUser } }) => {
    // GIVEN I sign in as a probation user
    await signIn(page, probationUser)

    // AND I navigate to a case with that status "${status.status}"
    await page.goto(`/cases/${status.crn}`)

    // WHEN I view the case details page
    const caseDetailsPage = new CaseDetailsPage(page)

    // THEN I should see the CAS3 status as "${status.status}"
    await caseDetailsPage.expectCas3Status(status.status)

    // AND I should see the ineligible information if available
    if (status.ineligibleInfo) {
      await caseDetailsPage.expectCas3IneligibleInformation(status.ineligibleInfo)
    }

    // AND I should see the submission information if available
    if (status.submissionInfo) {
      await caseDetailsPage.expectCas3SubmissionInfo()
    }

    // AND I should see the bedspace offered information if available
    if (status.bedspaceOffered) {
      await caseDetailsPage.expectCas3OfferInformation()
    }

    // AND I should see the arrival information if available
    if (status.arrivalInfo) {
      await caseDetailsPage.expectCas3ArrivalInformation()
    }

    // AND I should see the decline reason if available
    if (status.declineReason) {
      await caseDetailsPage.expectCas3DeclineReason(status.declineReason)
    }

    // AND I should see the booking information if available
    if (status.bookingInfo) {
      await caseDetailsPage.expectCas3BookingInformation()
    }

    // AND I should see the cancellation reason if available
    if (status.cancellationReason) {
      await caseDetailsPage.expectCas3CancellationReason(status.cancellationReason)
    }

    // WHEN I click the "${status.action}" link, if one is expected
    if (status.action) {
      await caseDetailsPage.clickCas3Link(status.action)

      // THEN I should be redirected correctly
      if (status.actionLink === 'redirect') {
        await caseDetailsPage.expectCas3Redirect()
      } else if (status.actionLink === 'referral') {
        await caseDetailsPage.expectExistingReferral()
      }
    }
  })
}
