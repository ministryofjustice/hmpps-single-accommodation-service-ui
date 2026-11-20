import { PublicProtectionFormData } from '@sas/ui'
import {
  checkYourAnswersRows,
  publicProtectionQuestionPages,
  QuestionPage,
  validateBody,
} from './publicProtectionCheck'
import { caseFactory } from '../testutils/factories'

describe('publicProtectionCheck', () => {
  describe('publicProtectionQuestionPages', () => {
    it('page data should match snapshot', () => {
      const personName = 'personName'
      expect(publicProtectionQuestionPages(personName, {})).toMatchSnapshot()
    })
  })

  describe('checkYourAnswersRows', () => {
    it('should return the correct rows', () => {
      const caseData = caseFactory.build({ forename: 'Giles', surname: 'Wembley-Hogg', crn: 'C12345' })
      const result = checkYourAnswersRows(caseData, {} as PublicProtectionFormData)
      expect(result).toMatchSnapshot()
    })
  })

  describe('validateBody', () => {
    it('should validate data for mandatory fields', () => {
      const page: Partial<QuestionPage> = {
        questions: [
          {
            label: 'label',
            name: 'question' as keyof PublicProtectionFormData,
            required: 'Enter this information',
            items: [],
          },
        ],
      }

      expect(validateBody(page as QuestionPage, {})).toEqual({ question: 'Enter this information' })

      expect(validateBody(page as QuestionPage, { question: 'value' } as PublicProtectionFormData)).toEqual({})
    })
  })
})
