import { AccommodationAddressDetails, AccommodationSummaryDto } from '@sas/api'
import {
  accommodationCell,
  caseAssignedTo,
  casesResultsSummary,
  casesToRows,
  personCell,
  accommodationCard,
  mapGetCasesQuery,
  queryToFilters,
  actionsCell,
  caseStatusCell,
} from './cases'
import { accommodationFactory, accommodationSummaryFactory, addressFactory, caseFactory } from '../testutils/factories'
import { statusCell } from './macros'
import config from '../config'

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
      const summaryFactory = (date: string) =>
        cellType === 'current'
          ? accommodationSummaryFactory.current(date, '2025-12-01')
          : accommodationSummaryFactory.next(date)

      const address: AccommodationAddressDetails = addressFactory.minimal().build({
        buildingNumber: '9',
        thoroughfareName: 'Foo Bar',
        postTown: 'Foocity',
        postcode: 'FO0 1BA',
      })

      const cas2Summary = summaryFactory('2026-02-03').build({
        address,
        type: { code: 'A10' },
      })
      const cas3Summary = summaryFactory('2026-07-31').build({ address, type: { code: 'A17' } })
      const privateSummary = summaryFactory('2026-09-10').build({
        address,
        type: { code: 'A07B' },
      })
      const noTypeSummary = summaryFactory('2026-05-23').build({ address, type: null })

      const testCases: [string, AccommodationSummaryDto][] = [
        ['CAS2', cas2Summary],
        ['CAS3', cas3Summary],
        ['Private address', privateSummary],
        ['No type', noTypeSummary],
        ['Undefined', undefined],
      ]

      // TODO uncomment when accommodationCell is updated to use AccommodationSummaryDto
      // it.each(testCases)('renders a formatted cell for a %s accommodation', (_, accommodation) => {
      //   expect(accommodationCell(cellType, accommodation)).toMatchSnapshot()
      // })

      it.each(testCases)('returns a context card object for a %s accommodation', (_, accommodation) => {
        expect(accommodationCard(cellType, accommodation)).toMatchSnapshot()
      })
    })
  })

  describe('actionsCell macro', () => {
    it('renders a formatted cell for a given list of actions', () => {
      expect(actionsCell(['Action 1', 'Action 2'])).toMatchSnapshot()
    })

    it('renders an empty cell when no actions are provided', () => {
      expect(actionsCell([])).toMatchSnapshot()
    })
  })

  describe('caseStatusCell', () => {
    it.each([
      ['RISK_OF_NO_FIXED_ABODE', 'Risk of no fixed abode', 'orange'],
      ['NO_FIXED_ABODE', 'No fixed abode', 'grey'],
      ['TRANSIENT', 'Transient', 'purple'],
      ['SETTLED', 'Settled', 'green'],
    ] as const)('returns the correct tag for %s status', (status, text, colour) => {
      const person = caseFactory.build({ status })
      expect(caseStatusCell(person)).toEqual(expect.objectContaining({ status: { text, colour } }))
    })

    it('includes the date for RISK_OF_NO_FIXED_ABODE status', () => {
      const person = caseFactory.build({
        status: 'RISK_OF_NO_FIXED_ABODE',
        currentAccommodation: accommodationFactory.current('2026-06-01', '2025-12-01').prison().build(),
      })
      expect(caseStatusCell(person)).toEqual(expect.objectContaining({ date: '2026-06-01' }))
    })
  })

  describe('casesToRows', () => {
    beforeEach(() => {
      config.flags.v10CasesList = true
    })

    it('returns formatted rows for a given list of cases', () => {
      const cases = caseFactory.buildList(1)

      expect(casesToRows(cases)).toEqual([
        [
          { html: personCell(cases[0]) },
          { html: accommodationCell('current', cases[0].currentAccommodation) },
          { html: accommodationCell('next', cases[0].nextAccommodation) },
          { html: statusCell(caseStatusCell(cases[0])) },
          { html: actionsCell(cases[0].actions) },
        ],
      ])
    })

    describe('when v10CasesList flag is off', () => {
      beforeEach(() => {
        config.flags.v10CasesList = false
      })

      it('returns only person cell', () => {
        const cases = caseFactory.buildList(1)

        expect(casesToRows(cases)).toEqual([[{ html: personCell(cases[0]) }]])
      })
    })
  })

  describe('caseAssignedTo', () => {
    it('returns "You (name)" when the assignedTo username matches the given username', () => {
      const person = caseFactory.build({
        assignedTo: { username: 'alice_smith', name: 'Alice Smith' },
      })

      expect(caseAssignedTo(person, 'alice_smith')).toEqual('You (Alice Smith)')
    })

    it('returns the assignedTo name when the assignedTo username does not match the given username', () => {
      const person = caseFactory.build({
        assignedTo: { username: 'bob_johnson', name: 'Bob Johnson' },
      })
      expect(caseAssignedTo(person, 'alice_smith')).toEqual('Bob Johnson')
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
