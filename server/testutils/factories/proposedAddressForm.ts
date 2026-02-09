import { faker } from '@faker-js/faker/locale/en_GB'
import { Factory } from 'fishery'
import { ProposedAddressFormData } from '@sas/ui'
import addressFactory from './accommodationAddressDetails'

const arrangementSubTypes: ProposedAddressFormData['arrangementSubType'][] = [
  'FRIENDS_OR_FAMILY',
  'SOCIAL_RENTED',
  'PRIVATE_RENTED_WHOLE_PROPERTY',
  'PRIVATE_RENTED_ROOM',
  'OWNED',
  'OTHER',
]

const settledTypes: ProposedAddressFormData['settledType'][] = ['SETTLED', 'TRANSIENT']
const verificationStatuses: ProposedAddressFormData['verificationStatus'][] = ['NOT_CHECKED_YET', 'PASSED', 'FAILED']
const nextAccommodationStatuses: ProposedAddressFormData['nextAccommodationStatus'][] = ['YES', 'NO', 'TO_BE_DECIDED']

class ProposedAddressFormFactory extends Factory<ProposedAddressFormData> {
  manualAddress() {
    return this.params({
      address: {
        buildingName: faker.location.street(),
        subBuildingName: faker.helpers.maybe(() => faker.location.secondaryAddress(), { probability: 0.3 }),
        postTown: faker.location.city(),
        county: faker.helpers.maybe(() => faker.location.state(), { probability: 0.3 }),
        postcode: faker.location.zipCode(),
        country: faker.location.country(),
        buildingNumber: undefined,
        thoroughfareName: undefined,
        dependentLocality: undefined,
        uprn: undefined,
      },
    })
  }
}

export default ProposedAddressFormFactory.define(() => {
  const arrangementSubType = faker.helpers.arrayElement(arrangementSubTypes)
  const verificationStatus = faker.helpers.arrayElement(verificationStatuses)

  return {
    arrangementSubType,
    arrangementSubTypeDescription: arrangementSubType === 'OTHER' ? faker.lorem.sentence() : undefined,
    settledType: faker.helpers.arrayElement(settledTypes),
    verificationStatus,
    address: addressFactory.build(),
    nextAccommodationStatus:
      verificationStatus === 'PASSED' ? faker.helpers.arrayElement(nextAccommodationStatuses) : undefined,
  }
})
