import { Factory } from 'fishery'
import { AccommodationDetailCommand } from '@sas/api'
import { faker } from '@faker-js/faker/locale/en_GB'
import addressFactory from './accommodationAddressDetails'

const arrangementSubTypes: AccommodationDetailCommand['arrangementSubType'][] = [
  'FRIENDS_OR_FAMILY',
  'SOCIAL_RENTED',
  'PRIVATE_RENTED_WHOLE_PROPERTY',
  'PRIVATE_RENTED_ROOM',
  'OWNED',
  'OTHER',
]

const settledTypes: AccommodationDetailCommand['settledType'][] = ['SETTLED', 'TRANSIENT']
const verificationStatuses: AccommodationDetailCommand['verificationStatus'][] = ['NOT_CHECKED_YET', 'PASSED', 'FAILED']
const nextAccommodationStatuses: AccommodationDetailCommand['nextAccommodationStatus'][] = [
  'YES',
  'NO',
  'TO_BE_DECIDED',
]

export default Factory.define<AccommodationDetailCommand>(() => {
  const address = addressFactory.build()
  const arrangementSubType = faker.helpers.arrayElement(arrangementSubTypes)
  const verificationStatus = faker.helpers.arrayElement(verificationStatuses)

  return {
    arrangementType: 'PRIVATE' as const,
    arrangementSubType,
    arrangementSubTypeDescription: arrangementSubType === 'OTHER' ? faker.lorem.sentence() : undefined,
    settledType: faker.helpers.arrayElement(settledTypes),
    verificationStatus,
    address,
    nextAccommodationStatus: faker.helpers.arrayElement(nextAccommodationStatuses),
  }
})
