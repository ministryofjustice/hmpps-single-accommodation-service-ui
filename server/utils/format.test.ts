import { AccommodationAddressDetails } from '@sas/api'
import {
  addressLines,
  eligibilityStatusTag,
  formatDate,
  formatEligibilityStatus,
  formatRiskLevel,
  formatStatus,
  referralStatusTag,
} from './format'
import { addressFactory } from '../testutils/factories'

describe('formatting utilities', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2025-12-10'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('formatDate', () => {
    it.each([
      ['2025-12-03', '3 December 2025'],
      ['2026-01-24', '24 January 2026'],
      ['not a date', 'Invalid Date'],
    ])('formats %s as the date %s', (date, expected) => {
      expect(formatDate(date)).toEqual(expected)
    })

    it.each([
      ['2025-12-03', 'days' as const, '-7'],
      ['2025-12-03', 'days ago/in' as const, '7 days ago'],
      ['2025-12-03', 'days for/in' as const, 'for 7 days'],
      ['2025-12-03', 'days for/left' as const, 'for 7 days'],
      ['2025-12-09', 'days' as const, '-1'],
      ['2025-12-09', 'days ago/in' as const, '1 day ago'],
      ['2025-12-09', 'days for/in' as const, 'for 1 day'],
      ['2025-12-09', 'days for/left' as const, 'for 1 day'],
      ['2025-12-10', 'days' as const, '0'],
      ['2025-12-10', 'days ago/in' as const, 'today'],
      ['2025-12-10', 'days for/in' as const, 'today'],
      ['2025-12-10', 'days for/left' as const, 'today'],
      ['2025-12-11', 'days' as const, '1'],
      ['2025-12-11', 'days ago/in' as const, 'in 1 day'],
      ['2025-12-11', 'days for/in' as const, 'in 1 day'],
      ['2025-12-11', 'days for/left' as const, '1 day left'],
      ['2025-12-22', 'days' as const, '12'],
      ['2025-12-22', 'days ago/in' as const, 'in 12 days'],
      ['2025-12-22', 'days for/in' as const, 'in 12 days'],
      ['2025-12-22', 'days for/left' as const, '12 days left'],
    ])('formats %s with %s', (date, format, expected) => {
      expect(formatDate(date, format)).toEqual(expected)
    })

    it.each([
      ['2000-12-03', '25'],
      ['2000-12-10', '25'],
      ['2000-12-11', '24'],
      ['not a date', 'Invalid Date'],
    ])('formats %s as the age %s', (date, expected) => {
      expect(formatDate(date, 'age')).toEqual(expected)
    })
  })

  describe('formatRiskLevel', () => {
    it.each([
      ['Low', 'LOW' as const],
      ['Medium', 'MEDIUM' as const],
      ['High', 'HIGH' as const],
      ['Very high', 'VERY_HIGH' as const],
      ['Unknown', undefined],
      ['Unknown', 'UNKNOWN' as const],
    ])('renders %s for risk level %s', (expected, level) => {
      expect(formatRiskLevel(level)).toEqual(expected)
    })
  })

  describe('referralStatusTag', () => {
    it.each([
      ['yellow', 'PENDING' as const],
      ['green', 'ACCEPTED' as const],
      ['grey', 'REJECTED' as const],
      ['grey', undefined],
      ['grey', 'UNKNOWN' as const],
    ])('renders %s for risk level %s', (tagColour, status) => {
      expect(referralStatusTag(status)).toEqual(
        `<strong class="govuk-tag govuk-tag--${tagColour}">${formatStatus(status)}</strong>`,
      )
    })
  })

  describe('eligibilityStatusTag', () => {
    it.each([
      ['grey', 'NOT_ELIGIBLE' as const],
      ['yellow', 'UPCOMING' as const],
      ['red', 'NOT_STARTED' as const],
      ['red', 'REJECTED' as const],
      ['grey', 'WITHDRAWN' as const],
      ['yellow', 'SUBMITTED' as const],
      ['green', 'CONFIRMED' as const],
    ])('renders %s for service status %s', (tagColour, status) => {
      expect(eligibilityStatusTag(status)).toEqual(
        `<strong class="govuk-tag govuk-tag--${tagColour}">${formatEligibilityStatus(status)}</strong>`,
      )
    })
  })

  describe('addressLines', () => {
    it.each([
      [
        'with building number',
        {
          buildingNumber: '123',
          thoroughfareName: 'Fake Street',
          county: 'Yorkshire',
          postTown: 'London',
          postcode: 'FA1 2BA',
        },
        ['123 Fake Street', 'London', 'FA1 2BA'],
      ],
      [
        'with building name',
        { buildingName: 'Fake House', thoroughfareName: 'Fake Street', postTown: 'London', postcode: 'FA1 2BA' },
        ['Fake House', 'Fake Street', 'London', 'FA1 2BA'],
      ],
      [
        'with sub-building name',
        {
          subBuildingName: 'Flat 4',
          buildingName: 'Fake House',
          thoroughfareName: 'Grand Street',
          postTown: 'Manchester',
          postcode: 'M21 0BF',
        },
        ['Flat 4 Fake House', 'Grand Street', 'Manchester', 'M21 0BF'],
      ],
    ])(
      'returns relevant lines for an address %s',
      (_, addressParts: Partial<AccommodationAddressDetails>, expected) => {
        const address = addressFactory.minimal().build(addressParts)
        expect(addressLines(address)).toEqual(expected)
      },
    )

    it('returns and empty array when no address parts are present', () => {
      expect(addressLines()).toEqual([])
    })
  })
})
