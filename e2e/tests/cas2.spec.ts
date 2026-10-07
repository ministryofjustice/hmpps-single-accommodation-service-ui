import { test } from '../test'
import { signIn } from '../steps/signIn'
import { getCaseLink } from '../steps/getCaseLink'
import CaseDetailsPage from '../pages/caseDetailsPage'

test.skip('CAS2 status is Not started', async ({ page, users: { probation: probationUser }, cases: { BASE_CASE } }) => {
  // GIVEN I sign in as a probation user
  await signIn(page, probationUser)

  // AND I navigate to the base test case
  const { caseLink } = await getCaseLink(page, BASE_CASE)
  await caseLink.click()

  // WHEN I view the case details page
  const caseDetailsPage = new CaseDetailsPage(page)

  // THEN I should see the CAS2 status as Not started
  await caseDetailsPage.expectCas2Status('Not started')

  // WHEN I click the Start application link for CAS2
  await caseDetailsPage.clickCas2Link('Start application')

  // THEN I should be redirected to the start CAS2 application page
  await caseDetailsPage.expectCas2Redirect()
})

test.skip('CAS2 status is Submitted', async ({ page, users: { probation: probationUser } }) => {
  // GIVEN I sign in as a probation user
  await signIn(page, probationUser)

  // AND I navigate to a submitted CAS2 application
  await page.goto(`/cases/Y066590`)

  // WHEN I view the case details page
  const caseDetailsPage = new CaseDetailsPage(page)

  // THEN I should see the CAS2 status as Submitted
  await caseDetailsPage.expectCas2Status('Submitted')

  // WHEN I click the View application link for CAS2
  await caseDetailsPage.clickCas2Link('View application')

  // THEN I should be redirected to the start CAS2 application page
  await caseDetailsPage.expectCas2Redirect()
})

test.skip('CAS2 status is More information needed', async ({ page, users: { probation: probationUser } }) => {
  // GIVEN I sign in as a probation user
  await signIn(page, probationUser)

  // AND I navigate to a submitted CAS2 application
  await page.goto(`/cases/Y066736`)

  // WHEN I view the case details page
  const caseDetailsPage = new CaseDetailsPage(page)

  // THEN I should see the CAS2 status as More information needed
  await caseDetailsPage.expectCas2Status('More information needed')

  // WHEN I click the View application link for CAS2
  await caseDetailsPage.clickCas2Link('View application')

  // THEN I should be redirected to the CAS2 application page
  await caseDetailsPage.expectCas2Application()
})

test.skip('CAS2 status is Withdrawn', async ({ page, users: { probation: probationUser } }) => {
  // GIVEN I sign in as a probation user
  await signIn(page, probationUser)

  // AND I navigate to a withdrawn CAS2 application
  await page.goto(`/cases/Y068126`)

  // WHEN I view the case details page
  const caseDetailsPage = new CaseDetailsPage(page)

  // THEN I should see the CAS2 status as Withdrawn
  await caseDetailsPage.expectCas2Status('Withdrawn')

  // WHEN I click the Start new application link for CAS2
  await caseDetailsPage.clickCas2Link('Start new application')

  // THEN I should be redirected to the start CAS2 application page
  await caseDetailsPage.expectCas2Redirect()
})

test.skip('CAS2 status is Awaiting decision', async ({ page, users: { probation: probationUser } }) => {
  // GIVEN I sign in as a probation user
  await signIn(page, probationUser)

  // AND I navigate to an awaiting decision CAS2 application
  await page.goto(`/cases/Y068127`)

  // WHEN I view the case details page
  const caseDetailsPage = new CaseDetailsPage(page)

  // THEN I should see the CAS2 status as Awaiting decision
  await caseDetailsPage.expectCas2Status('Awaiting decision')

  // WHEN I click the View application link for CAS2
  await caseDetailsPage.clickCas2Link('View application')

  // THEN I should be redirected to the CAS2 application page
  await caseDetailsPage.expectCas2Application()
})

test.skip('CAS2 status is On waiting list', async ({ page, users: { probation: probationUser } }) => {
  // GIVEN I sign in as a probation user
  await signIn(page, probationUser)

  // AND I navigate to an on waiting list CAS2 application
  await page.goto(`/cases/Y068128`)

  // WHEN I view the case details page
  const caseDetailsPage = new CaseDetailsPage(page)

  // THEN I should see the CAS2 status as On waiting list
  await caseDetailsPage.expectCas2Status('On waiting list')

  // WHEN I click the View application link for CAS2
  await caseDetailsPage.clickCas2Link('View application')

  // THEN I should be redirected to the CAS2 application page
  await caseDetailsPage.expectCas2Application()
})

test.skip('CAS2 status is Awaiting arrival', async ({ page, users: { probation: probationUser } }) => {
  // GIVEN I sign in as a probation user
  await signIn(page, probationUser)

  // AND I navigate to an awaiting arrival CAS2 application
  await page.goto(`/cases/Y068129`)

  // WHEN I view the case details page
  const caseDetailsPage = new CaseDetailsPage(page)

  // THEN I should see the CAS2 status as Awaiting arrival
  await caseDetailsPage.expectCas2Status('Awaiting arrival')

  // WHEN I click the View application link for CAS2
  await caseDetailsPage.clickCas2Link('View application')

  // THEN I should be redirected to the CAS2 application page
  await caseDetailsPage.expectCas2Application()
})
