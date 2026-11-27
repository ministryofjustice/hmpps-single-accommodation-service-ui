import BasePage from './basePage'

export default class ConfirmCurrentAddressPage extends BasePage {
  async expectPageToBeDisplayed() {
    await this.expectHeadingToBeDisplayed({
      name: /Confirm that .* has moved into this address/,
      level: 1,
    })
  }

  async confirmCurrentAddress() {
    await this.page.getByRole('button', { name: 'Confirm current address' }).click()
  }
}
