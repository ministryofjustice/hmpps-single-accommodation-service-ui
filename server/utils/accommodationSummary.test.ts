import { AccommodationAddressDetails, AccommodationSummaryDto } from '@sas/api'
import { accommodationSummariesFactory, accommodationSummaryFactory, addressFactory } from '../testutils/factories'
import {
  accommodationCard,
  accommodationCell,
  accommodationHistoryRows,
  accommodationHistoryTable,
  accommodationSummaryAddress,
  noFixedAbodeAlert,
} from './accommodationSummary'

describe('accommodationSummary', () => {
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

      const testCases: [string, AccommodationSummaryDto | null][] = [
        ['CAS2', cas2Summary],
        ['CAS3', cas3Summary],
        ['Private address', privateSummary],
        ['No type', noTypeSummary],
        ['Undefined', undefined],
        ['Null', null],
      ]

      it.skip.each(testCases)('renders a formatted cell for a %s accommodation', (_, accommodation) => {
        expect(accommodationCell(cellType, accommodation)).toMatchSnapshot()
      })

      it.each(testCases)('returns a context card object for a %s accommodation', (_, accommodation) => {
        expect(accommodationCard(cellType, accommodation)).toMatchSnapshot()
      })
    })
  })

  describe('accommodationSummaryAddress', () => {
    it('renders the HTML for an accommodation summary', () => {
      const accommodationSummary = accommodationSummaryFactory.build({
        type: { code: 'A01A', description: 'Householder (Owner - freehold or leasehold)' },
        address: addressFactory.minimal().build({
          postTown: 'London',
          postcode: 'SW1A 1AA',
        }),
      })

      expect(accommodationSummaryAddress(accommodationSummary)).toMatchSnapshot()
    })

    it('renders without the accommodation type', () => {
      const accommodationSummary = accommodationSummaryFactory.build({
        type: null,
        address: addressFactory.minimal().build({
          postTown: 'London',
          postcode: 'SW1A 1AA',
        }),
      })

      expect(accommodationSummaryAddress(accommodationSummary)).toMatchSnapshot()
    })
  })

  describe('accommodation history', () => {
    const accommodationHistory = [
      accommodationSummaryFactory.build({
        startDate: undefined,
        endDate: undefined,
        status: { code: 'M', description: 'Main' },
        type: { code: 'A02', description: 'Approved Premises' },
        address: addressFactory.minimal().build({
          postTown: 'London',
          postcode: 'SW1A 1AA',
        }),
      }),
      accommodationSummaryFactory.build({
        startDate: '2025-01-03',
        endDate: '2026-04-27',
        status: null,
        type: { code: 'A07A', description: 'Friends/Family (transient)' },
        address: addressFactory.minimal().build({
          postTown: 'Not Quite London',
          postcode: 'SW1A 2EE',
        }),
      }),
    ]

    describe('accommodationHistoryRows', () => {
      it('returns a row for each accommodation', () => {
        expect(accommodationHistoryRows(accommodationHistory)).toMatchSnapshot()
      })

      it('shows "Current" in end date cell when a row matches the current accommodation', () => {
        const currentAccommodation = accommodationHistory[1]
        const rows = accommodationHistoryRows(accommodationHistory, currentAccommodation)

        expect(rows[0][1]).toEqual({ text: '' })
        expect(rows[1][1]).toEqual({ text: 'Current' })
      })

      it('shows "Current" only on the current accommodation row when an address repeats', () => {
        const address = addressFactory.minimal().build({ uprn: '123456789', postTown: 'London' })
        const currentAccommodation = accommodationSummaryFactory.build({ startDate: '2024-01-01', address })
        const history = [
          accommodationSummaryFactory.build({ startDate: '2020-01-01', endDate: '2021-01-01', address }),
          accommodationSummaryFactory.build({ startDate: '2024-01-01', endDate: '2025-01-01', address }),
        ]

        const rows = accommodationHistoryRows(history, currentAccommodation)

        expect(rows[0][1]).toEqual({ text: '1 January 2021' })
        expect(rows[1][1]).toEqual({ text: 'Current' })
      })

      it('shows the end date when a row does not match the current accommodation', () => {
        const rows = accommodationHistoryRows(accommodationHistory)

        expect(rows[1][1]).toEqual({ text: '27 April 2026' })
      })
    })

    describe('accommodationHistoryTable macro', () => {
      it('renders the accommodation history table for a given list of accommodations', () => {
        expect(accommodationHistoryTable(accommodationHistory)).toMatchSnapshot()
      })

      it('renders a message and no table when there are no addresses', () => {
        expect(accommodationHistoryTable([])).toMatchSnapshot()
      })

      it('renders a message when there is an API error', () => {
        expect(accommodationHistoryTable(null, true)).toMatchSnapshot()
      })
    })
  })

  describe('noFixedAbodeAlert', () => {
    it('returns undefined if the case status is not NO_FIXED_ABODE or RISK_OF_NO_FIXED_ABODE', () => {
      const accommodationSummaries = accommodationSummariesFactory.build({ caseAccommodationStatus: undefined })
      expect(noFixedAbodeAlert(accommodationSummaries)).toMatchSnapshot()
    })

    it('returns no fixed abode alert for NO_FIXED_ABODE status', () => {
      const accommodationSummaries = accommodationSummariesFactory.nfa().build()
      expect(noFixedAbodeAlert(accommodationSummaries)).toMatchSnapshot()
    })

    it('returns risk of no fixed abode alert for RISK_OF_NO_FIXED_ABODE status', () => {
      const accommodationSummaries = accommodationSummariesFactory.riskOfNfa().build({
        currentAccommodation: accommodationSummaryFactory.current().build({ endDate: '2026-06-01' }),
      })
      expect(noFixedAbodeAlert(accommodationSummaries)).toMatchSnapshot()
    })

    it('uses the next accommodation end date when available for RISK_OF_NO_FIXED_ABODE status', () => {
      const accommodationSummaries = accommodationSummariesFactory.riskOfNfa().build({
        currentAccommodation: accommodationSummaryFactory.current().build({ endDate: '2026-06-01' }),
        nextAccommodation: accommodationSummaryFactory.next().build({ endDate: '2026-08-15' }),
      })
      expect(noFixedAbodeAlert(accommodationSummaries)).toEqual({
        status: 'RISK_OF_NO_FIXED_ABODE',
        date: '2026-08-15',
      })
    })

    it('returns a null date when neither accommodation has an end date', () => {
      const accommodationSummaries = accommodationSummariesFactory.riskOfNfa().build({
        currentAccommodation: accommodationSummaryFactory.current().build({ endDate: undefined }),
        nextAccommodation: null,
      })
      expect(noFixedAbodeAlert(accommodationSummaries)).toEqual({ status: 'RISK_OF_NO_FIXED_ABODE', date: null })
    })
  })
})
