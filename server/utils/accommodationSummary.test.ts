import { AccommodationAddressDetails, AccommodationDetail, AccommodationSummaryDto } from '@sas/api'
import { accommodationSummaryFactory, addressFactory } from '../testutils/factories'
import {
  accommodationCard,
  accommodationCell,
  accommodationHistoryEndDate,
  accommodationHistoryRows,
  accommodationHistoryTable,
  accommodationSummaryAddress,
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

      const testCases: [string, AccommodationSummaryDto][] = [
        ['CAS2', cas2Summary],
        ['CAS3', cas3Summary],
        ['Private address', privateSummary],
        ['No type', noTypeSummary],
        ['Undefined', undefined],
      ]

      it.skip.each(testCases)('renders a formatted cell for a %s accommodation', (_, accommodation) => {
        expect(accommodationCell(cellType, accommodation as AccommodationDetail)).toMatchSnapshot()
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
        startDate: '2026-04-27',
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
    })

    describe('accommodationHistoryEndDate', () => {
      beforeEach(() => {
        jest.useFakeTimers().setSystemTime(new Date('2026-05-01'))
      })

      afterEach(() => {
        jest.useRealTimers()
      })

      it('returns "Current" for the latest accommodation with a past startDate', () => {
        const accommodation = accommodationSummaryFactory.build({ startDate: '2026-04-27', endDate: undefined })
        expect(accommodationHistoryEndDate(accommodation, true)).toEqual('Current')
      })

      it('returns "Current" for the latest accommodation with endDate set', () => {
        const accommodation = accommodationSummaryFactory.build({ startDate: '2026-04-27', endDate: '2026-09-01' })
        expect(accommodationHistoryEndDate(accommodation, true)).toEqual('Current')
      })

      it('returns the formatted endDate for previous accommodations', () => {
        const accommodation = accommodationSummaryFactory.build({ startDate: '2025-01-03', endDate: '2026-04-27' })
        expect(accommodationHistoryEndDate(accommodation, false)).toEqual('27 April 2026')
      })

      it('returns an empty string for a previous accommodation with no endDate', () => {
        const accommodation = accommodationSummaryFactory.build({ startDate: '2025-01-03', endDate: undefined })
        expect(accommodationHistoryEndDate(accommodation, false)).toEqual('')
      })
    })

    describe('accommodationHistoryTable macro', () => {
      it('renders the accommodation history table for a given list of accommodations', () => {
        expect(accommodationHistoryTable(accommodationHistory)).toMatchSnapshot()
      })

      it('renders a message and no table when there are no addresses', () => {
        expect(accommodationHistoryTable([])).toMatchSnapshot()
      })
    })
  })
})
