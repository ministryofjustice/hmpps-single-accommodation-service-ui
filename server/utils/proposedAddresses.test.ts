import { accommodationFactory, addressFactory } from '../testutils/factories'
import { proposedAddressStatusCard } from './proposedAddresses'

describe('Proposed addresses utilities', () => {
  describe('proposedAddressStatusCard', () => {
    const baseAccommodationDetails = accommodationFactory.build({
      status: 'CHECKS_PASSED',
      createdAt: '2026-01-20T11:00:00.000Z',
      arrangementType: 'PRIVATE',
      arrangementSubType: 'OTHER',
      arrangementSubTypeDescription: "Somebody's attic",
      settledType: 'SETTLED',
      address: addressFactory.minimal().build({
        buildingNumber: '345',
        thoroughfareName: 'Foo Drive',
        dependentLocality: 'Barville',
        county: 'The North',
        postTown: 'Winklechester',
        postcode: 'ZZ1 1ZZ',
      }),
    })

    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-21'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('returns a "confirmed" proposed address status card object', () => {
      const proposedAddress = accommodationFactory.build({
        ...baseAccommodationDetails,
        status: 'CONFIRMED',
        createdAt: '2025-12-20T16:30:00.000Z',
      })

      expect(proposedAddressStatusCard(proposedAddress)).toMatchSnapshot()
    })

    it('returns a "checks failed" proposed address status card object', () => {
      const proposedAddress = accommodationFactory.build({
        ...baseAccommodationDetails,
        status: 'CHECKS_FAILED',
        createdAt: '2026-01-05T10:45:00.000Z',
      })

      expect(proposedAddressStatusCard(proposedAddress)).toMatchSnapshot()
    })

    it('returns a "not checked yet" proposed address status card object', () => {
      const proposedAddress = accommodationFactory.build({
        ...baseAccommodationDetails,
        status: 'NOT_CHECKED_YET',
        createdAt: '2026-01-20T09:30:00.000Z',
      })

      expect(proposedAddressStatusCard(proposedAddress)).toMatchSnapshot()
    })

    it('returns a "checks made" proposed address status card object', () => {
      const proposedAddress = accommodationFactory.build({
        ...baseAccommodationDetails,
        status: 'CHECKS_PASSED',
        createdAt: '2026-01-20T09:30:00.000Z',
      })

      expect(proposedAddressStatusCard(proposedAddress)).toMatchSnapshot()
    })
  })
})
