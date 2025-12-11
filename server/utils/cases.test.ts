import { AccommodationReferralDto as Referral } from '@sas/api'
import { AccommodationDto } from '@sas/ui'
import {
  accommodationCell,
  caseAssignedTo,
  casesTableCaption,
  casesToRows,
  personCell,
  referralHistoryTable,
  referralHistoryToRows,
} from './cases'
import { accommodationFactory, caseFactory, referralFactory } from '../testutils/factories'
import { dateCell, linksCell, statusCell, textCell } from './tables'

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

  describe('accommodationCell', () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2025-12-10'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    describe.each(['current', 'next'])('for %s accommodation', (cellType: 'current' | 'next') => {
      const factory = (date: string) =>
        cellType === 'current' ? accommodationFactory.current(date) : accommodationFactory.next(date)
      const prison = factory('2026-01-01').prison().build({ name: 'HMP Foobar', qualifier: 'licence' })
      const prisonNoQualifier = factory('2025-12-11').prison().build({ name: 'HMP Foobar', qualifier: undefined })
      const cas1Accommodation = factory('2026-02-03').cas('cas1').build()
      const cas2Accommodation = factory('2026-03-12').cas('cas2').build()
      const cas2v2Accommodation = factory('2026-05-23').cas('cas2v2').build()
      const cas3Accommodation = factory('2026-07-31').cas('cas3').build()
      const privateAccommodation = factory('2026-09-10')
        .privateAddress()
        .build({ name: "Parents' home", qualifier: 'bail', isSettled: true })
      const noFixedAbode = factory('2026-09-10').noFixedAbode().build()

      it.each<[string, AccommodationDto]>([
        ['Prison', prison],
        ['Prison (no qualifier)', prisonNoQualifier],
        ['CAS1', cas1Accommodation],
        ['CAS2', cas2Accommodation],
        ['CAS2v2', cas2v2Accommodation],
        ['CAS3', cas3Accommodation],
        ['Private address', privateAccommodation],
        ['No fixed abode', noFixedAbode],
      ])('returns a formatted cell for a %s accommodation', (_, accommodation: AccommodationDto) => {
        expect(accommodationCell(cellType, accommodation)).toMatchSnapshot()
      })
    })
  })

  describe('casesToRows', () => {
    it('returns formatted rows for a given list of cases', () => {
      const cases = caseFactory.buildList(1)

      expect(casesToRows(cases)).toEqual([
        [
          { html: personCell(cases[0]) },
          { html: accommodationCell('current', cases[0].currentAccommodation) },
          { html: accommodationCell('next', cases[0].nextAccommodation) },
          { html: '' },
        ],
      ])
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

  describe('referralHistoryTable', () => {
    it('returns referral history table for a given list of referrals', () => {
      const referral1 = referralFactory.build({
        id: '123456',
        type: 'CAS1',
        status: 'ACCEPTED',
        date: '2023-01-15',
      })
      const referral2 = referralFactory.build({
        id: '789012',
        type: 'CAS2',
        status: 'PENDING',
        date: '2023-02-20',
      })
      const referrals = [referral1, referral2]
      expect(referralHistoryTable(referrals)).toMatchSnapshot()
    })

    it('returns an empty table when there are no referrals', () => {
      expect(referralHistoryTable([])).toMatchSnapshot()
    })
  })

  describe('referralHistoryToRows', () => {
    it('returns formatted rows for a given list of referrals', () => {
      const referrals: Referral[] = referralFactory.buildList(1)

      expect(referralHistoryToRows(referrals)).toEqual([
        [
          textCell(referrals[0].type),
          statusCell(referrals[0].status),
          dateCell(referrals[0].date),
          linksCell([{ text: 'View', href: '#' }]),
        ],
      ])
    })
  })
})
