import { expect, Locator, Page } from '@playwright/test'

type DtrReferralHistoryDetails = {
  referredBy: string
  status: string
  submissionDate: string
  localAuthority: string
  reason?: string
}

export default class CaseDetailsPage {
  constructor(private readonly page: Page) {}

  private serviceCard(heading: string) {
    return this.page.locator('article.sas-card').filter({
      has: this.page.getByRole('heading', {
        name: heading,
        level: 3,
      }),
    })
  }

  dtrCard() {
    return this.serviceCard('Duty to Refer (DTR)')
  }

  async expectDtrStatus(status: string) {
    await expect(this.dtrCard()).toBeVisible()
    await expect(this.dtrCard().locator('.govuk-tag')).toHaveText(status)
  }

  async clickAddDtrReferralDetails() {
    await this.dtrCard()
      .getByRole('link', {
        name: 'Add referral details',
      })
      .click()
  }

  async expectDtrViewReferralLink() {
    await expect(
      this.dtrCard().getByRole('link', {
        name: 'View referral',
      }),
    ).toBeVisible()
  }

  async clickViewDtrReferral() {
    await this.dtrCard()
      .getByRole('link', {
        name: 'View referral',
      })
      .click()
  }

  crsCard() {
    return this.serviceCard('Commissioned Rehabilitative Services (CRS)')
  }

  async expectCrsStatus(status: string) {
    await expect(this.crsCard()).toBeVisible()
    await expect(this.crsCard().locator('.govuk-tag')).toHaveText(status)
  }

  async expectStartCrsReferralLink(crsUrl: string) {
    const startReferralLink = this.crsCard().getByRole('link', {
      name: 'Start referral',
    })

    await expect(startReferralLink).toBeVisible()
    await expect(startReferralLink).toHaveAttribute('href', crsUrl)
  }

  async clickStartCrsReferral() {
    await this.crsCard()
      .getByRole('link', {
        name: 'Start referral',
      })
      .click()
  }

  cas1Card() {
    return this.serviceCard('Approved premises (CAS1)')
  }

  cas2Card() {
    return this.serviceCard('Short-term accommodation (CAS2)')
  }

  cas3Card() {
    return this.serviceCard('CAS3 (transitional accommodation)')
  }

  private async expectSubmissionInfo(card: Locator) {
    await expect(card).toContainText('Submitted')
    await expect(card).toContainText('Submitted by')
    await expect(card).toContainText(/\d{1,2} \w+ \d{4}/)
  }

  private async expectCardStatus(card: Locator, status: string) {
    await expect(card).toBeVisible()
    await expect(card.locator('.govuk-tag')).toHaveText(status)
  }

  private async clickCardLink(card: Locator, action: string) {
    await card.getByRole('link', { name: action }).click()
  }

  private async expectDeclineReason(card: Locator, reason: string) {
    await expect(card).toContainText('Reason')
    await expect(card).toContainText(reason)
  }

  private async expectCasPopup(url: RegExp) {
    const newWindow = await this.page.waitForEvent('popup')
    await expect(newWindow).toHaveURL(url)
    return newWindow
  }

  async expectHintText(cardLocator: Locator, hintText: string) {
    await expect(cardLocator.locator('.sas-card__hint')).toHaveText(hintText)
  }

  async expectArrivalInformation() {
    await expect(this.cas2Card()).toContainText('Marked as arrived by')
  }

  async expectCas1ExpectedArrivalInformation() {
    await expect(this.cas1Card()).toContainText('Expected arrival')
    await expect(this.cas1Card()).toContainText('Duration')
    await expect(this.cas1Card()).toContainText('Request submitted by')
  }

  async clickCas1Link(action: string) {
    await this.clickCardLink(this.cas1Card(), action)
  }

  async clickCas2Link(action: string) {
    await this.clickCardLink(this.cas2Card(), action)
  }

  async clickCas3Link(action: string) {
    await this.clickCardLink(this.cas3Card(), action)
  }

  async expectCas1Status(status: string) {
    await this.expectCardStatus(this.cas1Card(), status)
  }

  async expectCas2Status(status: string) {
    await this.expectCardStatus(this.cas2Card(), status)
  }

  async expectCas3Status(status: string) {
    await this.expectCardStatus(this.cas3Card(), status)
  }

  async expectCas1SubmissionInfo() {
    await this.expectSubmissionInfo(this.cas1Card())
  }

  async expectCas2SubmissionInfo() {
    await this.expectSubmissionInfo(this.cas2Card())
  }

  async expectCas3SubmissionInfo() {
    await this.expectSubmissionInfo(this.cas3Card())
  }

  async expectCas1DeclineReason(reason: string) {
    await this.expectDeclineReason(this.cas1Card(), reason)
  }

  async expectCas2DeclineReason(reason: string) {
    await this.expectDeclineReason(this.cas2Card(), reason)
  }

  async expectCas3DeclineReason(reason: string) {
    await this.expectDeclineReason(this.cas3Card(), reason)
  }

  async expectCas2Hint(hintText: string) {
    await expect(this.cas2Card().locator('.sas-card__hint')).toHaveText(hintText)
  }

  async expectCas1Redirect() {
    const cas1Page = await this.expectCasPopup(/\/applications\/start$/)
    await expect(cas1Page.getByRole('heading', { name: 'Apply for an Approved Premises (AP) placement' })).toBeVisible()
  }

  async expectCas2Redirect() {
    const cas2Page = await this.expectCasPopup(/\/new-cohorts\/applications\/before-you-start$/)
    await expect(cas2Page.getByRole('heading', { name: 'Apply for short-term accommodation (CAS2)' })).toBeVisible()
  }

  async expectExistingApplication() {
    await this.expectCasPopup(/\/applications(\/|$)/)
  }

  proposedAddressesSection() {
    return this.page.locator('section').filter({
      has: this.page.getByRole('heading', {
        name: 'Proposed addresses',
        level: 2,
      }),
    })
  }

  proposedAddressCard(address: string) {
    return this.proposedAddressesSection()
      .locator('article.sas-card')
      .filter({
        has: this.page.getByRole('heading', {
          name: address,
          level: 3,
        }),
      })
  }

  currentAccommodationCard() {
    return this.page.locator('.sas-card').filter({
      has: this.page.getByRole('heading', {
        name: 'Current accommodation',
        level: 3,
      }),
    })
  }

  private referralHistoryTable() {
    return this.page.getByRole('table').filter({
      has: this.page.getByRole('columnheader', {
        name: 'Referral type',
      }),
    })
  }

  private dtrReferralHistoryRow(submissionDate: string, localAuthority: string) {
    return this.referralHistoryTable()
      .getByRole('row')
      .filter({
        has: this.page.getByRole('rowheader', {
          name: 'Duty to refer',
          exact: true,
        }),
      })
      .filter({
        hasText: `Submitted on ${submissionDate}`,
      })
      .filter({
        hasText: `Local authority: ${localAuthority}`,
      })
      .first()
  }

  async expectProposedAddressesEmptyState() {
    await expect(this.proposedAddressesSection()).toBeVisible()

    await expect(
      this.proposedAddressesSection().getByRole('heading', {
        name: 'Proposed addresses',
        level: 2,
      }),
    ).toBeVisible()

    await expect(
      this.proposedAddressesSection().getByRole('link', {
        name: 'Add a proposed address',
      }),
    ).toBeVisible()

    await expect(this.proposedAddressesSection().getByText('No proposed addresses have been added.')).toBeVisible()
  }

  async clickAddProposedAddress() {
    await this.proposedAddressesSection()
      .getByRole('link', {
        name: 'Add a proposed address',
      })
      .click()
  }

  async expectProposedAddressStatus(address: string, status: string) {
    const addressCard = this.proposedAddressCard(address)

    await expect(addressCard).toBeVisible()
    await expect(addressCard.locator('.govuk-tag')).toHaveText(status)
  }

  async expectProposedAddressViewDetailsLink(address: string) {
    await expect(
      this.proposedAddressCard(address).getByRole('link', {
        name: 'View details',
      }),
    ).toBeVisible()
  }

  async setProposedAddressAsCurrent(address: string) {
    await this.proposedAddressCard(address)
      .getByRole('link', {
        name: 'Set as current address',
      })
      .click()
  }

  async expectCurrentAccommodation(addressLine: string, townOrCity: string, postcode: string, status: string) {
    const currentAccommodationCard = this.currentAccommodationCard()
    const address = currentAccommodationCard.locator('.govuk-hint')

    await expect(currentAccommodationCard).toBeVisible()
    await expect(currentAccommodationCard.locator('.govuk-tag')).toHaveText(status)

    await expect(address).toContainText(addressLine)
    await expect(address).toContainText(townOrCity)
    await expect(address).toContainText(postcode)
  }

  async expectDtrReferralInHistory({
    referredBy,
    status,
    submissionDate,
    localAuthority,
    reason,
  }: DtrReferralHistoryDetails) {
    const referralRow = this.dtrReferralHistoryRow(submissionDate, localAuthority)

    await expect(referralRow).toBeVisible()

    await expect(
      referralRow.getByRole('rowheader', {
        name: 'Duty to refer',
        exact: true,
      }),
    ).toBeVisible()

    await expect(referralRow).toContainText(referredBy)

    await expect(referralRow.locator('.govuk-tag')).toHaveText(status)

    await expect(
      referralRow.getByText(`Submitted on ${submissionDate}`, {
        exact: true,
      }),
    ).toBeVisible()

    await expect(
      referralRow.getByText(`Local authority: ${localAuthority}`, {
        exact: true,
      }),
    ).toBeVisible()

    if (reason) {
      await expect(
        referralRow.getByText(`Reason: ${reason}`, {
          exact: true,
        }),
      ).toBeVisible()
    }

    await expect(
      referralRow.getByRole('link', {
        name: 'View referral',
      }),
    ).toBeVisible()
  }
}
