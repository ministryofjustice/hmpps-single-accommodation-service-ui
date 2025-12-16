import { formatDate, formatRiskLevel, formatStatus, referralStatusTag } from './format'

describe('formatting utilities', () => {
  describe('formatDate', () => {
    it.each([
      ['2025-12-03', '3 December 2025'],
      ['2026-01-24', '24 January 2026'],
      ['not a date', 'Invalid Date'],
    ])('formats %s as %s', (date, expected) => {
      expect(formatDate(date)).toEqual(expected)
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
})
