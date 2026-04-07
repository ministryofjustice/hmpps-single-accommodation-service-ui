import { expect, Locator, Page } from '@playwright/test'
import {
  CaseDto as Case,
  DutyToReferDto,
  EligibilityDto as Eligibility,
  AccommodationReferralDto as Referral,
  AccommodationDetail,
} from '@sas/api'
import { formatDate } from '../../../server/utils/dates'
import { eligibilityStatusCard } from '../../../server/utils/eligibility'
import paths from '../../../server/paths/ui'
import { accommodationType, settledTag } from '../../../server/utils/cases'
import { dutyToReferStatusCard } from '../../../server/utils/dutyToRefer'
import { proposedAddressStatusCard } from '../../../server/utils/proposedAddresses'
import { referralStatusTag, referralStatusType } from '../../../server/utils/referrals'
import { addressLines, formatAddress } from '../../../server/utils/addresses'
import PageWithCaseDetails from './pageWithCaseDetails'

export default class ProfileTrackerPage extends PageWithCaseDetails {
  constructor(
    page: Page,
    readonly caseData: Case,
  ) {
    super(page)
    this.header = page.locator('h1', { hasText: caseData.name })
  }

  static async visit(page: Page, caseData: Case): Promise<ProfileTrackerPage> {
    await page.goto(paths.cases.show({ crn: caseData.crn as string }))
    return ProfileTrackerPage.verifyOnPage(page, caseData)
  }

  async shouldShowDutyToRefer(dutyToRefer: DutyToReferDto) {
    await this.shouldShowCard('Duty to refer (DTR)', dutyToReferStatusCard(dutyToRefer))
  }

  async shouldShowEligibility(eligibility: Eligibility) {
    const cardConfigs = [
      { title: 'Approved premises (CAS1)', service: eligibility.cas1 },
      { title: 'CAS2 for HDC', service: eligibility.cas2Hdc },
      { title: 'CAS2 for court bail', service: eligibility.cas2CourtBail },
      { title: 'CAS2 for prison bail', service: eligibility.cas2PrisonBail },
      { title: 'CAS3 (transitional accommodation)', service: eligibility.cas3 },
    ]

    // TODO remove filter once the API always returns eligibility for all services
    const expectedCards = cardConfigs.filter(card => !!card.service)

    for await (const { title, service } of expectedCards) {
      await this.shouldShowCard(title, eligibilityStatusCard(title, service))
    }
  }

  async shouldShowAddress(accommodation: AccommodationDetail, card: Locator) {
    const addressParts = addressLines(accommodation.address)

    await expect(card).toContainText(accommodationType(accommodation))

    for await (const addressPart of addressParts) {
      await expect(card).toContainText(addressPart)
    }
  }

  async shouldShowNextAccommodationCard(accommodation: AccommodationDetail) {
    const card = this.page.locator('.sas-card', { hasText: 'Next accommodation' })

    await this.shouldShowAddress(accommodation, card)

    await expect(card).toContainText(`From ${formatDate(accommodation.startDate, 'long')}`)
    await expect(card).toContainText(`(${formatDate(accommodation.startDate, 'days for/in')})`)
  }

  async shouldShowNextAccommodationAlert(accommodation: AccommodationDetail) {
    const card = this.page.locator('.moj-alert', { hasText: /Risk of no fixed abode/ })
    const { startDate } = accommodation
    await expect(card).toContainText(`From ${formatDate(startDate, 'long')}`)
    await expect(card).toContainText(`(${formatDate(startDate, 'days for/in')})`)
  }

  async shouldShowCurrentAccommodationCard(accommodation: AccommodationDetail) {
    const card = this.page.locator('.sas-card', { hasText: 'Current accommodation' })

    if (accommodation.settledType) {
      await this.shouldShowStatusTag(settledTag(accommodation.settledType), card)
    }

    await this.shouldShowAddress(accommodation, card)

    await expect(card).toContainText(`Until ${formatDate(accommodation.endDate, 'long')}`)
    await expect(card).toContainText(`(${formatDate(accommodation.endDate, 'days for/in')})`)
  }

  async shouldShowCurrentAccommodationAlert(accommodation: AccommodationDetail) {
    const card = this.page.locator('.moj-alert', { hasText: 'No fixed abode' })
    const { startDate } = accommodation
    await expect(card).toContainText(`Since ${formatDate(startDate, 'long')}`)
    await expect(card).toContainText(`(${formatDate(startDate, 'days for/in')})`)
  }

  async shouldShowReferralHistory(referrals: Referral[]) {
    const card = this.page.locator('.govuk-summary-card').filter({
      has: this.page.getByRole('heading', { name: 'Referral history' }),
    })
    const table = card.locator('table.govuk-table')
    for await (const referral of referrals) {
      const i = referrals.indexOf(referral)
      const row = table.locator('tbody tr').nth(i)

      await expect(row).toContainText(referralStatusType(referral.type))
      await expect(row).toContainText(referralStatusTag(referral.status).text)
      await expect(row).toContainText(formatDate(referral.date))
      await expect(row).toContainText('View')
    }
  }

  async shouldShowProposedAddresses(proposedAddresses: AccommodationDetail[] = []) {
    const proposedAddressesSection = this.page.locator('section', {
      has: this.page.getByRole('heading', { name: 'Proposed addresses' }),
    })

    await expect(proposedAddressesSection).toBeVisible()
    await expect(proposedAddressesSection.getByRole('link', { name: 'Add a proposed address' })).toHaveAttribute(
      'href',
      paths.proposedAddresses.start({ crn: this.caseData.crn }),
    )

    if (!proposedAddresses.find(address => address.verificationStatus !== 'FAILED')) {
      await expect(proposedAddressesSection).toContainText('No proposed addresses have been added.')
    }

    if (proposedAddresses.find(address => address.verificationStatus === 'FAILED')) {
      await expect(
        proposedAddressesSection.getByRole('heading', { name: 'Addresses that failed checks' }),
      ).toBeVisible()
    }

    for await (const proposedAddress of proposedAddresses) {
      await this.shouldShowCard(formatAddress(proposedAddress.address), proposedAddressStatusCard(proposedAddress))
    }
  }
}
