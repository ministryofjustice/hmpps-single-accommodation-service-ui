import { Factory } from 'fishery'
import { AuditRecordDto, DtrSubmissionDto, DutyToReferDto, FieldChange, ProposedAccommodationDto } from '@sas/api'
import { faker } from '@faker-js/faker'
import proposedAccommodationFactory from './proposedAccommodation'

const dtrExtraInformation = (
  dtrData: DtrSubmissionDto,
  extraInformation?: Record<string, string>,
): Record<string, string> | undefined => {
  const localAuthorityAreaName = dtrData.localAuthority?.localAuthorityAreaName

  if (!localAuthorityAreaName && !extraInformation) {
    return undefined
  }

  return {
    ...(localAuthorityAreaName ? { localAuthorityAreaName } : {}),
    ...extraInformation,
  }
}

class AuditRecordFactory extends Factory<AuditRecordDto> {
  private dtrParams(
    type: 'CREATE' | 'UPDATE',
    submissionData: DtrSubmissionDto,
    status?: DutyToReferDto['status'],
    oldStatus?: DutyToReferDto['status'],
    extraInformation?: Record<string, string>,
  ) {
    const changes: FieldChange[] = [
      ...(status ? [{ field: 'status', value: status as string, oldValue: oldStatus as string }] : []),
      ...Object.entries(submissionData).flatMap(([field, value]) => {
        if (field === 'localAuthority') {
          return { field: 'localAuthorityAreaId', value: (value as DtrSubmissionDto['localAuthority'])?.localAuthorityAreaId }
        }
        return { field, value: value as string }
      }),
    ]

    return this.params({
      type,
      changes,
      extraInformation: dtrExtraInformation(submissionData, extraInformation),
    })
  }

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
    return this.dtrParams('CREATE', dtrData, status, undefined, extraInformation)
  }

  dutyToReferUpdated(
    dtrData: DtrSubmissionDto,
    status?: DutyToReferDto['status'],
    extraInformation?: Record<string, string>,
    oldStatus: DutyToReferDto['status'] = status,
  ) {
    return this.dtrParams('UPDATE', dtrData, status, oldStatus, extraInformation)
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
  commitDate: faker.helpers.maybe(() => faker.date.past().toISOString(), { probability: 0.8 }),
  changes: [
    {
      field: 'fieldName',
      value: 'New value',
    },
  ],
}))
