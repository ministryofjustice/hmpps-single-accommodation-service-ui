import BasePage from './basePage'

export default class AddressStatusCheckPage extends BasePage {
  async expectPageToBeDisplayed() {
    await this.expectHeadingToBeDisplayed({
      name: 'What is the status of the address checks?',
      level: 1,
    })
  }

  async selectPassed(reason: string) {
    await this.page.getByLabel('Passed').check()
    await this.page.getByLabel('Why is it suitable?').fill(reason)
  }

  async selectFailed(reason: string) {
    await this.page.getByLabel('Failed').check()
    await this.page.getByLabel('Why is it not suitable?').fill(reason)
  }

  async selectNotChecked() {
    await this.page.getByLabel('Not checked').check()
  }

  async continue() {
    await this.page.getByRole('button', { name: 'Continue' }).click()
  }
}
