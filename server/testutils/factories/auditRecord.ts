import { Factory } from 'fishery'
import { AccommodationDetail, AuditRecordDto, FieldChange } from '@sas/api'
import { faker } from '@faker-js/faker'
import accommodationFactory from './accommodation'

class AuditRecordFactory extends Factory<AuditRecordDto> {
  proposedAddressCreated(proposedAddress?: AccommodationDetail) {
    const addressDetails = proposedAddress || accommodationFactory.proposed().build()

    const changes: FieldChange[] = Object.entries(addressDetails).flatMap(([property, value]) => {
      if (property === 'address') {
        return Object.entries(value).map(([addressProperty, addressValue]) => ({
          field: addressProperty,
          value: addressValue,
        }))
      }
      return { field: property, value }
    })

    return this.params({
      type: 'CREATE',
      author: addressDetails.createdBy,
      commitDate: addressDetails.createdAt,
      changes,
    })
  }

  proposedAddressUpdated(changes: FieldChange[]) {
    return this.params({
      type: 'UPDATE',
      changes,
    })
  }
}

export default AuditRecordFactory.define(() => ({
  type: faker.helpers.arrayElement(['CREATE', 'UPDATE']),
  author: faker.person.fullName(),
  commitDate: faker.date.past().toISOString(),
  changes: [
    {
      field: 'fieldName',
      value: 'New value',
    },
  ],
}))
