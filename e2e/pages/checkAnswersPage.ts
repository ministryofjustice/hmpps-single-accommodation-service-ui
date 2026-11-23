import BasePage from './basePage'

export default class CheckAnswersPage extends BasePage {
  async expectPageToBeDisplayed() {
    await this.expectHeadingToBeDisplayed({
      name: 'Check your answers before adding the address',
      level: 1,
    })
  }

  async save() {
    await this.page.getByRole('button', { name: 'Save' }).click()
  }
}
