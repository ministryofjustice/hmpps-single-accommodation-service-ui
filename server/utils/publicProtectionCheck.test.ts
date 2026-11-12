import { PublicProtectionFormData } from '@sas/ui'
import {
  checkYourAnswersRows,
  publicProtectionQuestionPages,
  QuestionPage,
  validateBody,
} from './publicProtectionCheck'
import { caseFactory } from '../testutils/factories'
import { checkboxItems } from './utils'

const testPage = (data: Record<string, string>): QuestionPage => ({
  pageTitle: 'Page title',
  content: 'content',
  questions: [
    {
      type: 'radio',
      name: 'radioQuestion' as keyof PublicProtectionFormData,
      label: `Radio question`,
      items: checkboxItems(
        {
          option1: 'Option 1',
          option2: 'Option 2',
        },
        data.radioQuestion,
      ),
      required: 'Required error',
    },
    {
      type: 'checkBox',
      name: 'cbQuestion' as keyof PublicProtectionFormData,
      label: `Checkbox question`,
      hint: 'Question hint',
      items: checkboxItems(
        {
          option1: 'Option 1',
          option2: 'Option 2',
          none: 'Neither',
        },
        data.cbQuestion,
        { divider: 'Or' },
      ),
      required: 'Required error',
    },
  ],
})

describe('publicProtectionCheck', () => {
  describe('publicProtectionQuestionPages', () => {
    it('page data should match snapshot', () => {
      const personName = 'personName'
      expect(publicProtectionQuestionPages(personName, {})).toMatchSnapshot()
    })
  })

  describe('checkYourAnswersRows', () => {
    const caseData = caseFactory.build({ forename: 'Giles', surname: 'Wembley-Hogg', crn: 'C12345' })

    it('should look-up the labels for the selected checkboxes', () => {
      const result = checkYourAnswersRows({ testPage: testPage({}) }, caseData, {
        cbQuestion: ['option1', 'option2'],
      } as PublicProtectionFormData)[1]
      expect(result.key.text).toEqual('Checkbox question')
      expect(result.value.html).toEqual('<div class="sas-text-block">Option 1\nOption 2</div>')
    })

    it('should look-up the labels for the selected radios', () => {
      const result = checkYourAnswersRows({ testPage: testPage({}) }, caseData, {
        radioQuestion: 'option2',
      } as PublicProtectionFormData)[0]
      expect(result.key.text).toEqual('Radio question')
      expect(result.value.text).toEqual('Option 2')
    })

    it('should render unanswered questions', () => {
      const result = checkYourAnswersRows({ testPage: testPage({}) }, caseData, {} as PublicProtectionFormData)
      expect(result[0].value.text).toEqual('No answer given')
      expect(result[1].value.text).toEqual('No answer given')
    })
  })

  describe('validateBody', () => {
    it('should validate data for mandatory fields', () => {
      const page: Partial<QuestionPage> = {
        questions: [
          {
            type: 'radio',
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
