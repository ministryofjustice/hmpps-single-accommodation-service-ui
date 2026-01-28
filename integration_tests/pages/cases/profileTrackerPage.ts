import { expect, Locator, Page } from '@playwright/test'
import {
  CaseDto as Case,
  DutyToReferDto,
  EligibilityDto as Eligibility,
  AccommodationReferralDto as Referral,
  AccommodationDetail,
} from '@sas/api'
import AbstractPage from '../abstractPage'
import {
  formatDate,
  formatDutyToReferStatus,
  formatRiskLevel,
  formatStatus,
  formatEligibilityStatus,
  addressLines,
} from '../../../server/utils/format'
import { linksForStatus as linksForEligibilityStatus } from '../../../server/utils/eligibility'
import paths from '../../../server/paths/ui'
import { accommodationType } from '../../../server/utils/cases'
import { detailsForStatus, linksForStatus as linksForDutyToReferStatus } from '../../../server/utils/dutyToRefer'

export default class ProfileTrackerPage extends AbstractPage {
  readonly header: Locator

  private constructor(page: Page, caseData: Case) {
    super(page)
    this.header = page.locator('h1', { hasText: caseData.name })
  }

  static async verifyOnPage(page: Page, caseData: Case): Promise<ProfileTrackerPage> {
    const profileTrackerPage = new ProfileTrackerPage(page, caseData)
    await expect(profileTrackerPage.header).toBeVisible()
    return profileTrackerPage
  }

  static async visit(page: Page, caseData: Case): Promise<ProfileTrackerPage> {
    await page.goto(paths.cases.show({ crn: caseData.crn as string }))
    return ProfileTrackerPage.verifyOnPage(page, caseData)
  }

  async shouldShowCaseDetails(caseData: Case) {
    const details = [
      { label: 'RoSH', value: formatRiskLevel(caseData.riskLevel as Case['riskLevel']) },
      { label: 'Tier', value: caseData.tier },
      { label: 'CRN', value: caseData.crn },
      { label: 'Prison number', value: caseData.prisonNumber },
      { label: 'PNC reference', value: caseData.pncReference },
      { label: 'Date of birth', value: formatDate(caseData.dateOfBirth) },
      { label: 'Assigned to', value: caseData.assignedTo?.name },
    ]

    for await (const detail of details) {
      const dd = this.page.locator(`dt:has-text("${detail.label}") + dd`)
      await expect(dd).toContainText(detail.value ?? '')
    }
  }

  async shouldShowDutyToRefer(dutyToRefer: DutyToReferDto) {
    const card = this.page.locator('.sas-card').filter({
      has: this.page.getByRole('heading', { name: 'Duty to refer (DTR)' }),
    })

    await expect(card.locator('.govuk-tag')).toContainText(formatDutyToReferStatus(dutyToRefer?.status))

    for (const detail of detailsForStatus(dutyToRefer)) {
      expect(card).toContainText(detail.key.text)
      expect(card).toContainText(detail.value.text)
    }

    for (const link of linksForDutyToReferStatus(dutyToRefer?.status)) {
      expect(card.getByRole('link', { name: link.text })).toBeVisible()
    }
  }

  async shouldShowEligibility(eligibility: Eligibility) {
    const cardConfigs = [
      { title: 'Approved premises (CAS1)', service: eligibility.cas1 },
      { title: 'CAS2 for HDC', service: eligibility.cas2Hdc },
      { title: 'CAS2 for court bail', service: eligibility.cas2CourtBail },
      { title: 'CAS2 for prison bail', service: eligibility.cas2PrisonBail },
      { title: 'CAS3 (transitional accommodation)', service: eligibility.cas3 },
    ]

    const referralCards = this.page
      .locator('section', { has: this.page.getByRole('heading', { name: 'Accommodation referrals' }) })
      .locator('.sas-card')

    // TODO remove filter once the API always returns eligibility for all services
    const expectedCards = cardConfigs.filter(card => !!card.service)

    for await (const { title, service } of expectedCards) {
      const card = referralCards.filter({
        has: this.page.getByRole('heading', { name: title }),
      })

      await expect(card.locator('.govuk-tag')).toContainText(formatEligibilityStatus(service.serviceStatus))

      for await (const link of linksForEligibilityStatus(service.serviceStatus)) {
        await expect(card.getByRole('link', { name: link.text })).toBeVisible()
      }
    }
  }

  async shouldShowAddress(accommodation: AccommodationDetail, card: Locator) {
    const addressParts = addressLines(accommodation.address)
    await this.shouldShowSummaryItem('Address', addressParts, card)
  }

  async shouldShowNextAccommodationCard(accommodation: AccommodationDetail) {
    const card = this.page.locator('.sas-card', { hasText: 'Next accommodation' })

    const addressTitleParts = accommodationType(accommodation).split('<br>')
    await this.shouldShowSummaryItem('Status', addressTitleParts, card)

    await this.shouldShowAddress(accommodation, card)
  }

  async shouldShowNextAccommodationAlert(accommodation: AccommodationDetail) {
    const card = this.page.locator('.moj-alert', { hasText: /No fixed abode/ })
    const { startDate } = accommodation
    await expect(card).toContainText(`From ${formatDate(startDate, 'long')} (${formatDate(startDate, 'days for/in')})`)
  }

  async shouldShowCurrentAccommodationCard(accommodation: AccommodationDetail) {
    const card = this.page.locator('.sas-card', { hasText: 'Current accommodation' })

    const addressTitleParts = accommodationType(accommodation).split('<br>')
    await this.shouldShowSummaryItem('Type', addressTitleParts, card)
    const endDateLabel = accommodation.arrangementType === 'PRISON' ? 'Release date' : 'End date'
    await this.shouldShowSummaryItem(
      endDateLabel,
      [formatDate(accommodation.endDate), formatDate(accommodation.endDate, 'days for/left')],
      card,
    )
    await this.shouldShowAddress(accommodation, card)
  }

  async shouldShowCurrentAccommodationAlert(accommodation: AccommodationDetail) {
    const card = this.page.locator('.moj-alert', { hasText: 'Currently no fixed abode' })
    const { startDate } = accommodation
    await expect(card).toContainText(`Since ${formatDate(startDate, 'long')} (${formatDate(startDate, 'days for/in')})`)
  }

  async shouldShowReferralHistory(referrals: Referral[]) {
    const card = this.page.locator('.govuk-summary-card').filter({
      has: this.page.getByRole('heading', { name: 'Referral history' }),
    })
    const table = card.locator('table.govuk-table')
    for await (const referral of referrals) {
      const i = referrals.indexOf(referral)
      const row = table.locator('tbody tr').nth(i)

      await expect(row).toContainText(referral.type)
      await expect(row).toContainText(formatStatus(referral.status))
      await expect(row).toContainText(formatDate(referral.date))
      await expect(row).toContainText('View')
    }
  }
}
