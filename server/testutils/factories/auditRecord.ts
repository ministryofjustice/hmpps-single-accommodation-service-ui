import { Factory } from 'fishery'
import { AuditRecordDto, DtrSubmissionDto, DutyToReferDto, FieldChange, ProposedAccommodationDto } from '@sas/api'
import { faker } from '@faker-js/faker'
import proposedAccommodationFactory from './proposedAccommodation'

class AuditRecordFactory extends Factory<AuditRecordDto> {
  proposedAddressCreated(proposedAddress?: ProposedAccommodationDto) {
    const addressDetails = proposedAddress || proposedAccommodationFactory.build()

    const changes: FieldChange[] = Object.entries(addressDetails).flatMap(([property, value]) => {
      if (property === 'address') {
        return Object.entries(value).map(([addressProperty, addressValue]) => ({
          field: addressProperty,
          value: addressValue,
        }))
      }
      if (property === 'accommodationType') {
        return {
          field: 'accommodationTypeDescription',
          value: (value as ProposedAccommodationDto['accommodationType']).description,
        }
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

  dutyToReferAdded(
    dtrData: DtrSubmissionDto,
    status: DutyToReferDto['status'] = 'SUBMITTED',
    extraInformation?: Record<string, string>,
  ) {
    const changes: FieldChange[] = [
      { field: 'status', value: status },
      ...Object.entries(dtrData).map(([field, value]) => ({ field, value: value as string })),
    ]

    return this.params({
      type: 'CREATE',
      changes,
      extraInformation,
    })
  }

  dutyToReferUpdated(
    dtrData: DtrSubmissionDto,
    status?: DutyToReferDto['status'],
    extraInformation?: Record<string, string>,
  ) {
    const changes: FieldChange[] = [
      ...(status ? [{ field: 'status', value: status as string }] : []),
      ...Object.entries(dtrData).map(([field, value]) => ({ field, value: value as string })),
    ]

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
