import { test } from '@playwright/test'
import { auditRecordFactory, caseFactory, externalReferralFactory } from '../../../server/testutils/factories'
import externalReferralsApi from '../../mockApis/externalReferrals'
import { login } from '../../testUtils'
import ExternalReferralsSubmissionPage from '../../pages/cases/externalReferralsSubmissionPage'
import ProfileTrackerPage from '../../pages/cases/profileTrackerPage'
import ExternalReferralsDetailsPage from '../../pages/cases/externalReferralsDetailsPage'
import { stubProfilePage } from '../../helpers/profilePage'
import { externalReferralTimelineEntry } from '../../../server/utils/externalReferrals'

const crn = 'X123456'
const setupStubs = async () => {
  const referral = externalReferralFactory.build({ crn })
  const caseData = caseFactory.build({ crn })
  const referralTimeline = auditRecordFactory.buildList(2)
  await stubProfilePage({ crn, caseData })
  await externalReferralsApi.stubSubmitExternalReferral(crn)
  await externalReferralsApi.stubUpdateExternalReferral(referral)
  await externalReferralsApi.stubGetExternalReferralBySubmissionId(referral)
  await externalReferralsApi.stubListExternalReferral(crn, [referral])
  await externalReferralsApi.stubExternalreferralTimeline(crn, referral.submission.id, referralTimeline)

  return { caseData, referral, referralTimeline }
}

test.describe('external referrals', () => {
  test('should allow user to submit new external referral', async ({ page }) => {
    // Given I have stubbed the API responses
    const { caseData, referral } = await setupStubs()

    // And I am logged in
    await login(page)

    // When I visit the person tracker page
    const trackerPage = await ProfileTrackerPage.visit(page, caseData)

    // Then I see the external referral cards
    await trackerPage.shouldShowExternalReferralCards([referral])

    // When I click on the link to create a new referral
    await trackerPage.clickAddExternalReferralLink()

    // Then I should be on the external referral submission page
    const submissionPage = await ExternalReferralsSubmissionPage.verifyOnPage(page, 'Add external referral details')

    // And I should see the case details summary
    await submissionPage.shouldShowCaseSummary(caseData)

    // When I submit the empty form
    await submissionPage.clickButton('Save and continue')

    // Then I should see page errors for mandatory fields
    await submissionPage.shouldShowErrorMessagesForFields(
      { organisationName: 'Enter an organisation name', submissionDate: 'Enter a date' },
      ['submissionDate'],
    )

    // When I complete the form and submit
    await submissionPage.completeSubmissionForm(referral)
    await submissionPage.clickButton('Save and continue')

    // Then I see the confirmation banner
    await ProfileTrackerPage.verifyOnPage(page, caseData)
    await trackerPage.shouldShowBanner('Success', 'Referral details added')

    // And the API should have been called with the correct data
    await submissionPage.checkApiCalled(referral, 'submit')
  })

  test('should allow user see referrals on the tracker page and view their details', async ({ page }) => {
    // Given I have stubbed the API responses
    const { caseData, referral, referralTimeline } = await setupStubs()
    // And I am logged in
    await login(page)

    // When I visit the person tracker page
    const trackerPage = await ProfileTrackerPage.visit(page, caseData)

    // Then I see the external referral cards
    await trackerPage.shouldShowExternalReferralCards([referral])

    // When I select 'view details' on a referral card
    await trackerPage.clickViewReferralDetails()

    // Then I am on the referral details page
    const detailsPage = await ExternalReferralsDetailsPage.verifyOnPage(page, referral)

    // And I should see the referral details
    await detailsPage.shouldShowSubmissionDetails()

    // And I should see the timeline entries
    await Promise.all(
      referralTimeline.map((auditRecord, index) =>
        detailsPage.shouldShowTimelineEntry(externalReferralTimelineEntry(auditRecord), index),
      ),
    )

    // When I click the change link
    await detailsPage.clickLink('Change')

    // Then I should be on the edit page
    const editPage = await ExternalReferralsSubmissionPage.verifyOnPage(page, 'Edit external referral details')

    // When I edit a field and submit
    await editPage.completeInputByLabel('Reference number (optional)', '5678')
    await editPage.clickButton('Save and continue')

    // Then I am back on the referral details page
    await ExternalReferralsDetailsPage.verifyOnPage(page, referral)

    // And I should see a confirmation banner
    await detailsPage.shouldShowBanner('Success', 'Referral details changed')

    // And the API should have been called with the updated data
    await editPage.checkApiCalled(
      { ...referral, submission: { ...referral.submission, referenceNumber: '5678' } },
      'update',
    )
  })
})
