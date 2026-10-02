import { test } from '@playwright/test'
import { faker } from '@faker-js/faker'
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
  await externalReferralsApi.stubExternalReferralTimeline(crn, referral.submission.id, referralTimeline)
  await externalReferralsApi.stubExternalReferralAddNote(crn, referral.submission.id)

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

  test('should allow the user to see referrals on the tracker page and view and edit their details', async ({
    page,
  }) => {
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
    for await (const [index, entry] of referralTimeline.entries()) {
      await detailsPage.shouldShowTimelineEntry(externalReferralTimelineEntry(entry), index)
    }

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

  test('should allow user to add a timeline note', async ({ page }) => {
    // Given I have stubbed the API responses
    const noteText = faker.lorem.paragraph()
    const noteEvent = auditRecordFactory.build({ type: 'NOTE', changes: [{ field: 'note', value: noteText }] })
    const { caseData, referral, referralTimeline } = await setupStubs()
    // And I am logged in
    await login(page)

    // When I visit the referral details page
    const detailsPage = await ExternalReferralsDetailsPage.visit(page, caseData, referral)

    // And I should see the referral details
    await detailsPage.shouldShowSubmissionDetails()

    // When I click the 'Add note' button
    await detailsPage.clickButton('Add note')

    // Then I should see validation errors
    await detailsPage.shouldShowErrorMessagesForFields({ note: 'Enter a note' })

    // When I enter some note text and submit
    await detailsPage.completeInputByLabel('Add note', noteText)
    await externalReferralsApi.stubExternalReferralTimeline(crn, referral.submission.id, [
      noteEvent,
      ...referralTimeline,
    ])
    await detailsPage.clickButton('Add note')

    // Then I should be on the details page again.
    await ExternalReferralsDetailsPage.verifyOnPage(page, referral)

    // And I should see a confirmation banner
    await detailsPage.shouldShowBanner('Success', 'Note added')

    // And the new note should be at the top of the timeline
    await detailsPage.shouldShowTimelineEntry(externalReferralTimelineEntry(noteEvent))

    // And the API should have been called with the note
    await detailsPage.checkNoteApiCalled(referral, noteText)
  })
})
