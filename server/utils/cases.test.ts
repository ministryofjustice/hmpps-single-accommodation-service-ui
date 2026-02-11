import { AccommodationDetail, AccommodationReferralDto as Referral, AccommodationAddressDetails } from '@sas/api'
import { GetCasesQuery } from '@sas/ui'
import {
  accommodationCell,
  caseAssignedTo,
  casesTableCaption,
  casesToRows,
  personCell,
  referralHistoryTable,
  referralHistoryToRows,
  accommodationCard,
} from './cases'
import { accommodationFactory, addressFactory, caseFactory, referralFactory } from '../testutils/factories'
import { dateCell, linksCell, statusCell, textCell } from './tables'

describe('cases utilities', () => {
  describe('casesTableCaption', () => {
    it.each([
      [1, 'with no filter', {}, '1 person'],
      [0, 'with no filter', {}, '0 people'],
      [32, 'with no filter', {}, '32 people'],
      [4, 'with a search term', { searchTerm: 'Foo' }, "4 people matching 'Foo'"],
      [1, 'with an assigned to you filter', { assignedTo: 'you' }, '1 person assigned to you'],
      [3, 'with an assigned to anyone filter', { assignedTo: 'anyone' }, '3 people assigned to anyone'],
      [2, 'with a RoSH filter', { riskLevel: 'HIGH' }, '2 people filtered by high RoSH'],
      [
        3,
        'with a search term and RoSH filter',
        { searchTerm: 'Aaron', riskLevel: 'VERY_HIGH' },
        "3 people matching 'Aaron', filtered by very high RoSH",
      ],
      [
        2,
        'with a search term, assigned to and risk filter',
        { searchTerm: 'X234567', assignedTo: 'anyone', riskLevel: 'LOW' },
        "2 people matching 'X234567', assigned to anyone filtered by low RoSH",
      ],
    ])('renders a table caption for %s results %s', (resultsCount, _, query: GetCasesQuery, expected) => {
      const cases = caseFactory.buildList(resultsCount)

      expect(casesTableCaption(cases, query)).toEqual(expected)
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

  describe('accommodation renderers', () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2025-12-10'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    describe.each(['current', 'next'])('for %s accommodation', (cellType: 'current' | 'next') => {
      const factory = (date: string) =>
        cellType === 'current' ? accommodationFactory.current(date, '2025-12-01') : accommodationFactory.next(date)

      const address: AccommodationAddressDetails = addressFactory.minimal().build({
        buildingNumber: '9',
        thoroughfareName: 'Foo Bar',
        postTown: 'Foocity',
        postcode: 'FO0 1BA',
      })

      const prison = factory('2026-01-01')
        .prison()
        .build({ name: 'HMP Foobar', offenderReleaseType: 'LICENCE', address })
      const prisonNoQualifier = factory('2025-12-11')
        .prison()
        .build({ name: 'HMP Foobar', offenderReleaseType: undefined, address })
      const cas1Accommodation = factory('2026-02-03').cas('CAS1').build({ address })
      const cas2Accommodation = factory('2026-03-12').cas('CAS2').build({ address })
      const cas2v2Accommodation = factory('2026-05-23').cas('CAS2V2').build({ address })
      const cas3Accommodation = factory('2026-07-31').cas('CAS3').build({ address })
      const privateAccommodation = factory('2026-09-10')
        .privateAddress()
        .build({ name: "Parents' home", arrangementSubType: 'FRIENDS_OR_FAMILY', address })
      const noFixedAbode = factory('2026-09-10').noFixedAbode().build()

      const testCases: [string, AccommodationDetail][] = [
        ['Prison', prison],
        ['Prison (no qualifier)', prisonNoQualifier],
        ['CAS1', cas1Accommodation],
        ['CAS2', cas2Accommodation],
        ['CAS2v2', cas2v2Accommodation],
        ['CAS3', cas3Accommodation],
        ['Private address', privateAccommodation],
        ['No fixed abode', noFixedAbode],
        ['Undefined', undefined],
      ]

      it.each(testCases)('returns a formatted cell for a %s accommodation', (_, accommodation) => {
        expect(accommodationCell(cellType, accommodation)).toMatchSnapshot()
      })

      it.each(testCases)('returns a formatted card for a %s accommodation', (_, accommodation) => {
        expect(accommodationCard(cellType, accommodation)).toMatchSnapshot()
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
