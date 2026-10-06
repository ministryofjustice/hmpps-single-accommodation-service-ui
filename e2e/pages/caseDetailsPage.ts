import { expect, Page } from '@playwright/test'

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

  async expectCas1Status(status: string) {
    await expect(this.cas1Card()).toBeVisible()
    await expect(this.cas1Card().locator('.govuk-tag')).toHaveText(status)
  }

  cas2Card() {
    return this.serviceCard('Short-term accommodation (CAS2)')
  }

  async expectCas2Status(status: string) {
    await expect(this.cas2Card()).toBeVisible()
    await expect(this.cas2Card().locator('.govuk-tag')).toHaveText(status)
  }

  async clickCas2Link(action: string) {
    await this.cas2Card().getByRole('link', { name: action }).click()
  }

  async expectCas2Hint(hintText: string) {
    await expect(this.cas2Card().locator('.sas-card__hint')).toHaveText(hintText)
  }

  cas2Action() {
    return this.page.waitForEvent('popup')
  }

  private async expectCas2Popup(url: RegExp) {
    const cas2Page = await this.page.waitForEvent('popup')
    await expect(cas2Page).toHaveURL(url)
    return cas2Page
  }

  async expectCas2Redirect() {
    const cas2Page = await this.expectCas2Popup(/\/new-cohorts\/applications\/before-you-start$/)
    await expect(cas2Page.getByRole('heading', { name: 'Apply for short-term accommodation (CAS2)' })).toBeVisible()
  }

  async expectCas2Application() {
    await this.expectCas2Popup(/\/assess\/applications$/)
  }

  cas3Card() {
    return this.serviceCard('CAS3 (transitional accommodation)')
  }

  async expectCas3Status(status: string) {
    await expect(this.cas3Card()).toBeVisible()
    await expect(this.cas3Card().locator('.govuk-tag')).toHaveText(status)
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
