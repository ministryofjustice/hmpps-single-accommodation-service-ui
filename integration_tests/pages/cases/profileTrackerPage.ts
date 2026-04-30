import { expect, Locator, Page } from '@playwright/test'
import {
  CaseDto as Case,
  EligibilityDto as Eligibility,
  AccommodationReferralDto as Referral,
  AccommodationDetail,
  AccommodationSummaryDto,
} from '@sas/api'
import { formatDate } from '../../../server/utils/dates'
import { eligibilityToEligibilityCards } from '../../../server/utils/eligibility'
import paths from '../../../server/paths/ui'
import { proposedAddressStatusCard } from '../../../server/utils/proposedAddresses'
import { referralStatusTag, referralStatusType } from '../../../server/utils/referrals'
import { addressLines, formatAddress } from '../../../server/utils/addresses'
import PageWithCaseDetails from './pageWithCaseDetails'
import { accommodationType, settledTag } from '../../../server/utils/accommodationSummary'

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

  async shouldShowEligibility(eligibility: Eligibility) {
    for await (const card of eligibilityToEligibilityCards(eligibility, this.caseData.crn)) {
      await this.shouldShowCard(card.heading, card)
    }
  }

  async shouldShowNextActions(actions: string[]) {
    const nextActionsCard = this.page.locator('.sas-card--block', { hasText: 'Next actions' })

    for await (const action of actions) {
      await expect(nextActionsCard.getByRole('listitem').filter({ hasText: action })).toBeVisible()
    }
  }

  async shouldShowAddress(accommodation: AccommodationSummaryDto, card: Locator) {
    const addressParts = addressLines(accommodation.address)

    await expect(card).toContainText(accommodationType(accommodation))

    for await (const addressPart of addressParts) {
      await expect(card).toContainText(addressPart)
    }
  }

  async shouldShowNextAccommodationCard(accommodation: AccommodationSummaryDto) {
    const card = this.page.locator('.sas-card', { hasText: 'Next accommodation' })

    const tag = settledTag(accommodation.type)
    if (tag) await this.shouldShowStatusTag(tag, card)

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

  async shouldNotShowNextAccommodationCard() {
    await expect(this.page.locator('.sas-card', { hasText: 'Next accommodation' })).toHaveCount(0)
  }

  async shouldShowCurrentAccommodationCard(accommodation: AccommodationSummaryDto) {
    const card = this.page.locator('.sas-card', { hasText: 'Current accommodation' })

    const tag = settledTag(accommodation.type)
    if (tag) await this.shouldShowStatusTag(tag, card)

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

  async shouldShowAccommodationHistory(accommodations: AccommodationSummaryDto[]) {
    const card = this.page.locator('.govuk-summary-card').filter({
      has: this.page.getByRole('heading', { name: 'Accommodation history' }),
    })
    const table = card.locator('table.govuk-table')

    await this.shouldShowTableHeaders(['Start date', 'End date', 'Address', 'Status'], table)

    for await (const accommodation of accommodations) {
      const i = accommodations.indexOf(accommodation)
      const row = table.locator('tbody tr').nth(i)

      await expect(row).toContainText(formatDate(accommodation.startDate))
      if (!accommodation.endDate) {
        await expect(row).toContainText('Current')
      } else {
        await expect(row).toContainText(formatDate(accommodation.endDate))
      }
      for await (const addressPart of addressLines(accommodation.address)) {
        await expect(row).toContainText(addressPart)
      }
      await expect(row).toContainText(accommodation.status.description)
    }
  }
}
