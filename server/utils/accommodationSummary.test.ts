import { AccommodationAddressDetails, AccommodationSummaryDto } from '@sas/api'
import {
  accommodationSummariesFactory,
  accommodationSummaryFactory,
  addressFactory,
  caseFactory,
} from '../testutils/factories'
import {
  accommodationCard,
  accommodationCell,
  accommodationHistoryRows,
  accommodationHistoryTable,
  accommodationStatusCell,
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
      const privateAndProposedAccommodation = summaryFactory('2026-09-10').build({
        address,
        type: { code: 'A07B' },
        crn: 'L489936',
        proposedAccommodationId: 'df4b775f-29fa-413e-b39b-1df368288df7',
      })
      const noTypeSummary = summaryFactory('2026-05-23').build({ address, type: null })

      const testCases: [string, AccommodationSummaryDto | null][] = [
        ['CAS2', cas2Summary],
        ['CAS3', cas3Summary],
        ['Private address', privateSummary],
        ['Private and proposed accommodation', privateAndProposedAccommodation],
        ['No type', noTypeSummary],
        ['Undefined', undefined],
        ['Null', null],
      ]

      it.each(testCases)('renders a formatted cell for a %s accommodation', (_, accommodation) => {
        const caseData = caseFactory.build({
          accommodationSummaries: {
            caseAccommodationStatus: undefined,
            caseAccommodationStatusDate: undefined,
            currentAccommodation: cellType === 'current' ? accommodation : null,
            nextAccommodation: cellType === 'next' ? accommodation : null,
          },
        })
        expect(accommodationCell(cellType, caseData)).toMatchSnapshot()
      })

      it.each(testCases)('returns a context card object for a %s accommodation', (_, accommodation) => {
        expect(accommodationCard(cellType, accommodation)).toMatchSnapshot()
      })

      it('returns an empty cell for a limited access case', () => {
        expect(accommodationCell(cellType, caseFactory.limitedAccess().build())).toEqual('')
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

  describe('accommodationStatusCell', () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2025-12-10'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it.each([
      ['no accommodation summaries', undefined, undefined],
      ['no case status', accommodationSummariesFactory.build({ caseAccommodationStatus: undefined }), undefined],
      [
        'a no fixed abode status',
        accommodationSummariesFactory.nfa().build(),
        { status: { text: 'No fixed abode', colour: 'grey' } },
      ],
      [
        'a risk of no fixed abode status',
        accommodationSummariesFactory.riskOfNfa().build({ caseAccommodationStatusDate: '2025-12-20' }),
        {
          status: { text: 'Risk of no fixed abode', colour: 'orange' },
          dateText: 'From 20 December 2025 (in 10 days)',
        },
      ],
      [
        'a confirmed settled accommodation',
        accommodationSummariesFactory.confirmed().build({
          caseAccommodationStatus: 'SETTLED',
          caseAccommodationStatusDate: '2025-12-01',
        }),
        { status: { text: 'Settled', colour: 'green' }, dateText: 'Since 1 December 2025 (for 9 days)' },
      ],
      [
        'an upcoming confirmed transient accommodation',
        accommodationSummariesFactory.confirmedUpcoming().build({
          caseAccommodationStatus: 'TRANSIENT',
          caseAccommodationStatusDate: '2025-12-20',
        }),
        { status: { text: 'Transient', colour: 'pink' }, dateText: 'From 20 December 2025 (in 10 days)' },
      ],
    ])('returns the expected status cell for %s', (_, accommodationSummaries, expected) => {
      expect(accommodationStatusCell(caseFactory.build({ accommodationSummaries }))).toEqual(expected)
    })
  })
})
