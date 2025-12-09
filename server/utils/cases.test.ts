import { CaseDto as Case } from '@sas/api'
import { caseAssignedTo, casesTableCaption, casesToRows, personCell } from './cases'
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

  describe('personCell', () => {
    it('returns a formatted cell for a given person', () => {
      const person = caseFactory.build({
        name: 'Dave Foo',
        crn: 'C321654',
        prisonNumber: 'A1234BC',
        dateOfBirth: '1980-10-09',
        tier: 'B2',
        riskLevel: 'VERY_HIGH',
      })

      expect(personCell(person)).toMatchSnapshot()
    })
  })

  describe('casesToRows', () => {
    it('returns formatted rows for a given list of cases', () => {
      const cases: Case[] = caseFactory.buildList(1)

      expect(casesToRows(cases)).toEqual([[{ html: personCell(cases[0]) }, { html: '' }]])
    })
  })

  describe('caseAssignedTo', () => {
    it('returns "You (name)" when the assignedTo id matches the given id', () => {
      const person = caseFactory.build({
        assignedTo: { id: 123, name: 'Alice Smith' },
      })

      expect(caseAssignedTo(person, '123')).toEqual('You (Alice Smith)')
    })

    it('returns the assignedTo name when the assignedTo id does not match the given id', () => {
      const person = caseFactory.build({
        assignedTo: { id: 456, name: 'Bob Johnson' },
      })
      expect(caseAssignedTo(person, '123')).toEqual('Bob Johnson')
    })
  })
})
