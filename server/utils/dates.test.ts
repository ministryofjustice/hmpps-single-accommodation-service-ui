import { calculateAge, formatDate, formatDateAndDaysAgo } from './dates'

describe('formatting utilities', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2025-12-10T12:00:00.000Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('calculateAge', () => {
    const TEST_DATE = '2025-12-03'

    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date(TEST_DATE))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it.each([
      [25, '2000-12-02'],
      [25, '2000-12-03'],
      [24, '2000-12-04'],
      [25, '2000-02-29'],
    ])('returns age of %s for date of birth %s', (age, dob) => {
      expect(calculateAge(dob)).toEqual(age)
    })
  })

  describe('formatDate', () => {
    it.each([
      ['2025-12-03', '3 December 2025'],
      ['2026-01-24', '24 January 2026'],
      ['not a date', 'Invalid Date'],
      [undefined, 'Invalid Date'],
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
      ['2025-12-09T23:59:59.000Z', 'days' as const, '-1'],
      ['2025-12-09T23:59:59.000Z', 'days ago/in' as const, '1 day ago'],
      ['2025-12-09T23:59:59.000Z', 'days for/in' as const, 'for 1 day'],
      ['2025-12-09T23:59:59.000Z', 'days for/left' as const, 'for 1 day'],
      ['2025-12-09T00:00:00.000Z', 'days' as const, '-1'],
      ['2025-12-09T00:00:00.000Z', 'days ago/in' as const, '1 day ago'],
      ['2025-12-09T00:00:00.000Z', 'days for/in' as const, 'for 1 day'],
      ['2025-12-09T00:00:00.000Z', 'days for/left' as const, 'for 1 day'],
      ['2025-12-11T00:00:00.000Z', 'days' as const, '1'],
      ['2025-12-11T00:00:00.000Z', 'days ago/in' as const, 'in 1 day'],
      ['2025-12-11T00:00:00.000Z', 'days for/in' as const, 'in 1 day'],
      ['2025-12-11T00:00:00.000Z', 'days for/left' as const, '1 day left'],
      ['2025-12-11T23:59:59.000Z', 'days' as const, '1'],
      ['2025-12-11T23:59:59.000Z', 'days ago/in' as const, 'in 1 day'],
      ['2025-12-11T23:59:59.000Z', 'days for/in' as const, 'in 1 day'],
      ['2025-12-11T23:59:59.000Z', 'days for/left' as const, '1 day left'],
    ])('formats %s as a %s relative date', (date, format, expected) => {
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

  describe('formatDateAndDaysAgo', () => {
    it.each([
      ['2025-12-03', '3 December 2025 (7 days ago)'],
      ['2025-12-09', '9 December 2025 (1 day ago)'],
      ['2025-12-10', '10 December 2025 (today)'],
      ['not a date', 'Invalid Date'],
      [undefined, 'Invalid Date'],
    ])('formats %s as the date and days ago %s', (date, expected) => {
      expect(formatDateAndDaysAgo(date)).toEqual(expected)
    })
  })
})
