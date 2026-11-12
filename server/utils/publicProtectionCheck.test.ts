import { PublicProtectionFormData } from '@sas/ui'
import { checkYourAnswersRows, publicProtectionQuestionPages } from './publicProtectionCheck'
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
})
