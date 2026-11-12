import { Page } from '@playwright/test'
import AbstractPage from '../abstractPage'
import { publicProtectionQuestionPages } from '../../../server/utils/publicProtectionCheck'

export default class PublicProtectionQuestionPage extends AbstractPage {
  constructor(page: Page, title: string) {
    super(page)
    this.header = page.locator('h1', { hasText: title })
  }

  async verifyCheckYourAnswers(personName: string, formData: Record<string, string>) {
    await Promise.all(
      Object.values(publicProtectionQuestionPages)
        .map(QuestionPage => {
          const questionPage = new QuestionPage(personName, formData)
          return questionPage
            .questions()
            .map(question => this.shouldShowSummaryItem(question.label, formData[question.name]))
        })
        .flat(),
    )
  }
}
