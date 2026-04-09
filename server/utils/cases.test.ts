import { AccommodationDetail, AccommodationAddressDetails } from '@sas/api'
import {
  accommodationCell,
  caseAssignedTo,
  casesResultsSummary,
  casesToRows,
  personCell,
  accommodationCard,
  mapGetCasesQuery,
  queryToFilters,
  caseStatusTag,
  actionsCell,
} from './cases'
import { accommodationFactory, addressFactory, caseFactory } from '../testutils/factories'
import { statusTag } from './macros'

describe('cases utilities', () => {
  describe('casesResultsSummary', () => {
    it.each([
      [1, '1 person'],
      [0, '0 people'],
      [32, '32 people'],
    ])('renders results summary for %s results %s', (resultsCount, expected) => {
      const cases = caseFactory.buildList(resultsCount)

      expect(casesResultsSummary(cases)).toEqual(expected)
    })
  })

  describe('personCell macro', () => {
    it('renders a formatted cell for a given person', () => {
      const person = caseFactory.build({
        name: 'Dave Foo',
        crn: 'C321654',
        prisonNumber: 'A1234BC',
        dateOfBirth: '1980-10-09',
        tierScore: 'B2',
        riskLevel: 'VERY_HIGH',
      })

      expect(personCell(person)).toMatchSnapshot()
    })
  })

  describe('accommodationCell and accommodationCard macros', () => {
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
        .build({ settledType: 'SETTLED', arrangementSubType: 'FRIENDS_OR_FAMILY', address })
      const transientPrivateAccommodation = factory('2026-09-10').privateAddress().build({
        settledType: 'TRANSIENT',
        arrangementSubType: 'OTHER',
        arrangementSubTypeDescription: 'Some place',
        address,
      })
      const noFixedAbode = factory('2026-09-10').noFixedAbode().build()

      const testCases: [string, AccommodationDetail][] = [
        ['Prison', prison],
        ['Prison (no qualifier)', prisonNoQualifier],
        ['CAS1', cas1Accommodation],
        ['CAS2', cas2Accommodation],
        ['CAS2v2', cas2v2Accommodation],
        ['CAS3', cas3Accommodation],
        ['Settled Private address', privateAccommodation],
        ['Transient Private address', transientPrivateAccommodation],
        ['No fixed abode', noFixedAbode],
        ['Undefined', undefined],
      ]

      it.each(testCases)('renders a formatted cell for a %s accommodation', (_, accommodation) => {
        expect(accommodationCell(cellType, accommodation)).toMatchSnapshot()
      })

      it.each(testCases)('returns a context card object for a %s accommodation', (_, accommodation) => {
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
          { html: statusTag(caseStatusTag(cases[0])) },
          { html: actionsCell(cases[0].actions) },
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

  describe('mapGetCasesQuery', () => {
    it('maps a UI query for the assigned user to the correct API query', () => {
      expect(mapGetCasesQuery({ assignedTo: 'you' }, '123')).toEqual({ assignedTo: '123' })
    })

    it('maps a UI query for anyone to the correct API query', () => {
      expect(mapGetCasesQuery({ assignedTo: 'anyone' }, '123')).toEqual({ assignedTo: '' })
    })
  })

  describe('queryToFilters', () => {
    it('returns an empty array when no filters are applied', () => {
      expect(queryToFilters({}, '/')).toEqual([])
    })

    it('does not include a filter tag when assignedTo is "you"', () => {
      expect(queryToFilters({ assignedTo: 'you' }, '/')).toEqual([])
    })

    it('returns all active filter tags when multiple filters are applied', () => {
      const url = '/?assignedTo=anyone&riskLevel=HIGH&searchTerm=CRN123'
      expect(queryToFilters({ assignedTo: 'anyone', riskLevel: 'HIGH', searchTerm: 'CRN123' }, url)).toEqual([
        { text: "Search: 'CRN123'", href: '/?assignedTo=anyone&riskLevel=HIGH' },
        { text: 'Assigned to: anyone', href: '/?riskLevel=HIGH&searchTerm=CRN123' },
        { text: 'RoSH: High', href: '/?assignedTo=anyone&searchTerm=CRN123' },
      ])
    })

    it.each([
      [
        'assignedTo',
        { assignedTo: 'anyone' } as const,
        '/?assignedTo=anyone&riskLevel=HIGH',
        [{ text: 'Assigned to: anyone', href: '/?riskLevel=HIGH' }],
      ],
      [
        'riskLevel',
        { riskLevel: 'VERY_HIGH' } as const,
        '/?assignedTo=anyone&riskLevel=VERY_HIGH',
        [{ text: 'RoSH: Very high', href: '/?assignedTo=anyone' }],
      ],
      [
        'searchTerm',
        { searchTerm: 'CRN123' } as const,
        '/?searchTerm=CRN123&riskLevel=LOW',
        [{ text: "Search: 'CRN123'", href: '/?riskLevel=LOW' }],
      ],
    ])('includes a filter tag when %s is set', (_, query, url, expected) => {
      expect(queryToFilters(query, url)).toEqual(expected)
    })
  })
})
