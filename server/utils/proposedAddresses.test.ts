import { addressFactory, proposedAddressFactory } from '../testutils/factories'
import { proposedAddressStatusCard } from './proposedAddresses'

describe('Proposed addresses utilities', () => {
  describe('proposedAddressStatusCard', () => {
    const baseProposedAddress = proposedAddressFactory.build({
      status: 'CONFIRMED',
      createdAt: '2026-01-20T11:00:00.000Z',
      housingArrangementType: 'OTHER',
      housingArrangementTypeDescription: "Somebody's attic",
      settledType: 'SETTLED',
      address: addressFactory.build({
        line1: '345 Foo Drive',
        line2: 'Barville',
        region: 'The North',
        city: 'Winklechester',
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
      const proposedAddress = proposedAddressFactory.build({
        ...baseProposedAddress,
        status: 'CONFIRMED',
        createdAt: '2025-12-20T16:30:00.000Z',
      })

      expect(proposedAddressStatusCard(proposedAddress)).toMatchSnapshot()
    })

    it('returns a "checks failed" proposed address status card object', () => {
      const proposedAddress = proposedAddressFactory.build({
        ...baseProposedAddress,
        status: 'FAILED',
        createdAt: '2026-01-05T10:45:00.000Z',
      })

      expect(proposedAddressStatusCard(proposedAddress)).toMatchSnapshot()
    })

    it('returns a "not checked yet" proposed address status card object', () => {
      const proposedAddress = proposedAddressFactory.build({
        ...baseProposedAddress,
        status: 'NOT_CHECKED_YET',
        createdAt: '2026-01-20T09:30:00.000Z',
      })

      expect(proposedAddressStatusCard(proposedAddress)).toMatchSnapshot()
    })

    it('returns a "checks made" proposed address status card object', () => {
      const proposedAddress = proposedAddressFactory.build({
        ...baseProposedAddress,
        status: 'CHECKED',
        createdAt: '2026-01-20T09:30:00.000Z',
      })

      expect(proposedAddressStatusCard(proposedAddress)).toMatchSnapshot()
    })
  })
})
