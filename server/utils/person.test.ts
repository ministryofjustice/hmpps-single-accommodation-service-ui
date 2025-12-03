import { calculateAge } from './person'

describe('person utilities', () => {
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
})
