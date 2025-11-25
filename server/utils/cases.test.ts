import { Case } from '@sas/api'
import { casesTableCaption, casesToRows } from './cases'
import { caseFactory } from '../testutils/factories'

describe('cases utilities', () => {
  describe('casesTableCaption', () => {
    it('returns the table caption for multiple cases', () => {
      const cases = caseFactory.buildList(3)

      expect(casesTableCaption(cases)).toEqual('3 people assigned to you')
    })

    it('returns the table caption for a single case', () => {
      const cases = caseFactory.buildList(1)

      expect(casesTableCaption(cases)).toEqual('1 person assigned to you')
    })
  })

  describe('casesToRows', () => {
    it('returns formatted rows for a given list of cases', () => {
      const cases: Case[] = [
        {
          name: 'John Smith',
          crn: 'C321654',
        },
      ]

      expect(casesToRows(cases)).toEqual([[{ html: 'John Smith, C321654' }, { html: '' }]])
    })
  })
})
