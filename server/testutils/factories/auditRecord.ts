import { Factory } from 'fishery'
import { AccommodationDetail, AuditRecordDto, DtrSubmissionDto, FieldChange } from '@sas/api'
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
      return { field: property, value: value as string }
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

  dutyToReferSubmissionAdded(dtrData: DtrSubmissionDto) {
    const changes: FieldChange[] = [
      { field: 'status', value: 'SUBMITTED' },
      ...Object.entries(dtrData).map(([field, value]) => ({ field, value: value as string })),
    ]

    return this.dutyToReferAdded(changes, {
      localAuthorityAreaName: dtrData.localAuthority.localAuthorityAreaName,
    })
  }

  dutyToReferSubmissionUpdated(dtrData: DtrSubmissionDto) {
    const changes: FieldChange[] = Object.entries(dtrData).map(([field, value]) => ({
      field,
      value: value as string,
    }))

    return this.dutyToReferUpdated(changes, {
      localAuthorityAreaName: dtrData.localAuthority.localAuthorityAreaName,
    })
  }

  dutyToReferAdded(changes: FieldChange[], extraInformation: Record<string, string> = {}) {
    return this.params({
      type: 'CREATE',
      changes,
      extraInformation,
    })
  }

  dutyToReferUpdated(changes: FieldChange[], extraInformation: Record<string, string> = {}) {
    return this.params({
      type: 'UPDATE',
      changes,
      extraInformation,
    })
  }

  note(note: string) {
    return this.params({
      type: 'NOTE',
      changes: [{ field: 'note', value: note }],
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
