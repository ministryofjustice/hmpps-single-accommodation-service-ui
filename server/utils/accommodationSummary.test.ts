import { AccommodationAddressDetails, AccommodationDetail, AccommodationSummaryDto } from '@sas/api'
import { accommodationCard, accommodationCell } from './accommodationSummary'
import { accommodationSummaryFactory, addressFactory } from '../testutils/factories'

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
})
