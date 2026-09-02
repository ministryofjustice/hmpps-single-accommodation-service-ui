import { expect, Page } from '@playwright/test'

export default class AddPropAddressPage {
  constructor(private readonly page: Page) {}

  async expectPageToBeDisplayed() {
    await expect(
      this.page.getByRole('heading', {
        name: 'Find an address',
        level: 1,
      }),
    ).toBeVisible()
  }

  async enterAddress(propertyNameOrNumber: string, postcode: string) {
    await this.page.getByLabel('Property name or number').fill(propertyNameOrNumber)
    await this.page.getByLabel('UK postcode').fill(postcode)
  }

  async findAddress() {
    await this.page.getByRole('button', { name: 'Find address' }).click()
  }
}
