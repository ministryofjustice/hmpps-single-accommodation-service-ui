import { test } from '../test'
import { signIn } from '../steps/signIn'
import { CaseDetailsPage } from '../pages/caseDetailsPage'

// TODO: Re-enable when a known CRN with no proposed addresses is available in Dev.
test.skip(
  'Proposed addresses empty state is displayed',
  async ({ page, users: { probation: probationUser } }) => {
    // GIVEN I sign in as a probation user
    await signIn(page, probationUser)

    // AND I click on the first result
    const firstCaseName = await page.getByRole('row').nth(1).getByRole('link').textContent()
    await page.getByRole('link', { name: firstCaseName }).click()

    // WHEN I view the case details page
    const caseDetailsPage = new CaseDetailsPage(page)

    // THEN I should see the Proposed addresses empty state
    await caseDetailsPage.expectProposedAddressesEmptyState()
  },
)
