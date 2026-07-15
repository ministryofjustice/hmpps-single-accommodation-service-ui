import { expect, Page } from '@playwright/test'

export class AddPropAddressPage {
  constructor(private readonly page: Page) {}

  async expectPage() {
    await expect(
      this.page.getByRole('heading', {
        name: 'What is the address',
        level: 1,
      }),
    ).toBeVisible()
  }

  async enterAddress(propertyNameOrNumber: string, postcode: string) {
    await this.page
      .getByLabel('Property name or number')
      .fill(propertyNameOrNumber)

    await this.page
      .getByLabel('UK postcode')
      .fill(postcode)
  }

  async findAddress() {
    await this.page
      .getByRole('button', { name: 'Find address' })
      .click()
  }
}
