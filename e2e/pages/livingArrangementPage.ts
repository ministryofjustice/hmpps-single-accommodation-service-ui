import BasePage from './basePage'

export default class LivingArrangementPage extends BasePage {
  async expectPageToBeDisplayed() {
    await this.expectHeadingToBeDisplayed({
      name: /Which best describes the living arrangement/,
      level: 1,
    })
  }

  async selectLivingArrangement(option: string) {
    await this.page.getByLabel(option).check()
  }

  async continue() {
    await this.page.getByRole('button', { name: 'Continue' }).click()
  }
}
