import BasePage from './basePage'

export default class SelectAddressPage extends BasePage {
  async expectPageToBeDisplayed() {
    await this.expectHeadingToBeDisplayed({
      name: 'Confirm address',
      level: 1,
    })
  }

  async continue() {
    await this.page.getByRole('button', { name: 'Continue' }).click()
  }
}
