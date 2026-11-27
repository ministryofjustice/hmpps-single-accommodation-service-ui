import BasePage from './basePage'

export default class ConfirmAddressPage extends BasePage {
  async expectPageToBeDisplayed() {
    await this.expectHeadingToBeDisplayed({
      name: /Do you want to confirm this as the next address/,
      level: 1,
    })
  }

  async confirmAddress() {
    await this.page.getByLabel('Yes').check()
  }

  async doNotConfirmAddress() {
    await this.page.getByLabel('Not yet').check()
  }

  async continue() {
    await this.page.getByRole('button', { name: 'Continue' }).click()
  }
}
