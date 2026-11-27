import { test } from '@playwright/test'
import { caseFactory, eligibilityFactory } from '../../../server/testutils/factories'
import externalReferralsApi from '../../mockApis/externalReferrals'
import { login } from '../../testUtils'
import ProfileTrackerPage from '../../pages/cases/profileTrackerPage'
import { stubProfilePage } from '../../helpers/profilePage'
import userApi from '../../mockApis/user'
import casesApi from '../../mockApis/cases'
import PublicProtectionQuestionPage from '../../pages/cases/publicProtectionQuestionPage'
import { displayName } from '../../../server/utils/cases'
import serviceResultFactory from '../../../server/testutils/factories/serviceResult'

const crn = 'X123456'
const eligibility = eligibilityFactory.build({
  crn,
  ppc: { serviceResult: serviceResultFactory.ppc().build({ serviceStatus: 'PPC_NOT_STARTED' }) },
})

const setupStubs = async () => {
  const caseData = caseFactory.build({ crn })
  await stubProfilePage({ crn, caseData, eligibility })
  await casesApi.stubGetCases([caseData])
  await externalReferralsApi.stubSubmitExternalReferral(crn)
  await userApi.stubGetTeams()

  return { caseData }
}

test.describe('public protection checker', () => {
  test('should allow user to complete the public protection checks', async ({ page }) => {
    // Given I have stubbed the API responses
    const { caseData } = await setupStubs()

    // And I am logged in
    await login(page)

    // When I visit the person tracker page
    const trackerPage = await ProfileTrackerPage.visit(page, caseData)
    // Then I see public protection check card

    // await trackerPage.shouldShowExternalReferralCards([referral])

    // When I click on the link to create a new referral
    await trackerPage.clickPublicProtectionCheckLink()

    // Then I see the intro page
    const introPage = await PublicProtectionQuestionPage.verifyOnPage(page, 'Check public protection needs')

    // When I click continue
    await introPage.clickButton('Continue')

    // Then I see the risk management page
    const riskPage = await PublicProtectionQuestionPage.verifyOnPage(page, 'Public protection risk and needs')

    // When I click continue on the empty form
    await riskPage.clickButton('Continue')
    // Then I see validation errors
    await riskPage.shouldShowErrorMessagesForFields({ riskManagement: 'Choose an answer' })

    // When I complete the form and click continue
    await riskPage.selectRadioByLabel('Yes')
    await riskPage.clickButton('Continue')

    // Then I am on the control measures page
    const controlPage = await PublicProtectionQuestionPage.verifyOnPage(
      page,
      'Managing public protection risks and needs',
    )

    // When I click continue on the empty form
    await riskPage.clickButton('Continue')
    // Then I see validation errors
    await riskPage.shouldShowErrorMessagesForFields({ controlMeasures: 'Select one or more measures' })

    // When I complete the form and click continue
    await controlPage.selectCheckboxByLabel('Stable accommodation')
    await controlPage.clickButton('Continue')

    // Then I am on the support needs page
    const supportPage = await PublicProtectionQuestionPage.verifyOnPage(page, 'Support needs')
    // When I click continue on the empty form
    await supportPage.clickButton('Continue')
    // Then I see validation errors
    await supportPage.shouldShowErrorMessagesForFields({
      supportNeeds: 'Choose if needs can be met by accommodation and support',
    })

    // When I complete the form and click continue
    await supportPage.selectRadioByLabel('Yes')
    await supportPage.clickButton('Continue')

    const checkYourAnswersPage = await PublicProtectionQuestionPage.verifyOnPage(page, 'Check your answers')
    await checkYourAnswersPage.verifyCheckYourAnswers(displayName(caseData), {
      riskManagement: 'Yes',
      controlMeasures: 'Stable accommodation',
      supportNeeds: 'Yes',
    })

    await checkYourAnswersPage.clickButton('Submit')
  })
})
