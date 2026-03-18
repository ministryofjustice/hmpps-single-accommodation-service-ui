import { accommodationFactory, addressFactory, auditRecordFactory } from '../testutils/factories'
import { timelineEntry } from './timeline'

describe('timelineEntry', () => {
  it('returns an Address created timeline entry from an audit record', () => {
    const proposedAddress = accommodationFactory.proposed().build({
      address: addressFactory.minimal().build({
        buildingNumber: '1',
        thoroughfareName: 'Street',
        postTown: 'Town',
        postcode: 'P0 5TC',
      }),
      verificationStatus: 'NOT_CHECKED_YET',
      arrangementSubType: 'OTHER',
      arrangementSubTypeDescription: 'Some reason',
      createdBy: 'Dr. Kay Towne',
      createdAt: '2026-03-06T21:37:21.666Z',
    })
    const auditRecord = auditRecordFactory.proposedAddressCreated(proposedAddress).build()

    expect(timelineEntry(auditRecord)).toMatchSnapshot()
  })
})
