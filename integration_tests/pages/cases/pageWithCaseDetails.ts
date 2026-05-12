import { expect } from '@playwright/test'
import { CaseDto } from '@sas/api'
import AbstractPage from '../abstractPage'
import { riskLevelStatusTag } from '../../../server/utils/riskLevel'
import { formatDate } from '../../../server/utils/dates'

export default class PageWithCaseDetails extends AbstractPage {
  async shouldShowCaseDetails(caseData: CaseDto) {
    let heading = caseData.name
    if (caseData.caseAccess === 'RESTRICTED') heading += ' (limited access offender)'

    await expect(this.page.getByRole('heading', { name: heading, level: 1 })).toBeVisible()

    const details = [
      { label: 'RoSH', value: riskLevelStatusTag(caseData.riskLevel).text },
      { label: 'Tier', value: caseData.tierScore },
      { label: 'CRN', value: caseData.crn },
      { label: 'Prison number', value: caseData.prisonNumber },
      { label: 'PNC reference', value: caseData.pncReference },
      { label: 'Date of birth', value: formatDate(caseData.dateOfBirth) },
      { label: 'Assigned to', value: `${caseData.assignedTo?.forename} ${caseData.assignedTo?.surname}` },
    ]

    for await (const detail of details) {
      const dd = this.page.locator(`dt:has-text("${detail.label}") + dd`)
      await expect(dd).toContainText(detail.value ?? '')
    }
  }
}
