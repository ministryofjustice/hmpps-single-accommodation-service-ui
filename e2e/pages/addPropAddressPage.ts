import { Page } from '@playwright/test'
import { expectHeadingToBeDisplayed } from '../utils/expectHeadingToBeDisplayed'

export default class AddPropAddressPage {
  constructor(private readonly page: Page) {}

  async expectPageToBeDisplayed() {
    await expectHeadingToBeDisplayed(this.page, {
      name: 'Find an address',
      level: 1,
    })
  }

  async enterAddress(propertyNameOrNumber: string, postcode: string) {
    await this.page.getByLabel('Property name or number').fill(propertyNameOrNumber)
    await this.page.getByLabel('UK postcode').fill(postcode)
  }

  async findAddress() {
    await this.page.getByRole('button', { name: 'Find address' }).click()
  }
}
