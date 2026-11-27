import BasePage from './basePage'

export default class AddPropAddressPage extends BasePage {
  async expectPageToBeDisplayed() {
    await this.expectHeadingToBeDisplayed({
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
