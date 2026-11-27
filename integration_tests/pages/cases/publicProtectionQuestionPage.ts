import { Page } from '@playwright/test'
import AbstractPage from '../abstractPage'
import { publicProtectionQuestionPages, Question } from '../../../server/utils/publicProtectionCheck'

export default class PublicProtectionQuestionPage extends AbstractPage {
  constructor(page: Page, title: string) {
    super(page)
    this.header = page.locator('h1', { hasText: title })
  }

  async verifyCheckYourAnswers(personName: string, formData: Record<string, string>) {
    const pages = publicProtectionQuestionPages(personName, formData)

    for (const page of Object.values(pages)) {
      const questions = (page.questions || []) as Question[]
      for (const question of questions) {
        // eslint-disable-next-line no-await-in-loop
        await this.shouldShowSummaryItem(question.label, formData[question.name])
      }
    }
  }
}
