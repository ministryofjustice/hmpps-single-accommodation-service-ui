import { expect, Page } from '@playwright/test'

export class CaseDetailsPage {
  constructor(private readonly page: Page) {
  }

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

  crsCard() {
    return this.serviceCard('Commissioned Rehabilitative Services (CRS)')
  }

  async expectCrsStatus(status: string) {
    await expect(this.crsCard()).toBeVisible()
    await expect(this.crsCard().locator('.govuk-tag')).toHaveText(status)
  }

  cas1Card() {
    return this.serviceCard('Approved premises (CAS1)')
  }

  async expectCas1Status(status: string) {
    await expect(this.cas1Card()).toBeVisible()
    await expect(this.cas1Card().locator('.govuk-tag')).toHaveText(status)
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
    return this.proposedAddressesSection().locator('article.sas-card').filter({
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

    await expect(
      this.proposedAddressesSection().getByText(
        'No proposed addresses have been added.',
      ),
    ).toBeVisible()
  }

  async clickAddProposedAddress() {
    await this.proposedAddressesSection()
      .getByRole('link', { name: 'Add a proposed address' })
      .click()
  }

  async expectProposedAddressStatus(address: string, status: string) {
    const addressCard = this.proposedAddressCard(address)

    await expect(addressCard).toBeVisible()
    await expect(addressCard.locator('.govuk-tag')).toHaveText(status)
  }

  async expectProposedAddressViewDetailsLink(address: string) {
    await expect(
      this.proposedAddressCard(address).getByRole('link', { name: 'View details' }),
    ).toBeVisible()
  }

  async setProposedAddressAsCurrent(address: string) {
    await this.proposedAddressCard(address)
      .getByRole('link', { name: 'Set as current address' })
      .click()
  }

  async expectCurrentAccommodation(
    addressLine: string,
    townOrCity: string,
    postcode: string,
    status: string,
  ) {
    const currentAccommodationCard = this.currentAccommodationCard()
    const address = currentAccommodationCard.locator('.govuk-hint')

    await expect(currentAccommodationCard).toBeVisible()
    await expect(currentAccommodationCard.locator('.govuk-tag')).toHaveText(status)

    await expect(address).toContainText(addressLine)
    await expect(address).toContainText(townOrCity)
    await expect(address).toContainText(postcode)
  }
}
