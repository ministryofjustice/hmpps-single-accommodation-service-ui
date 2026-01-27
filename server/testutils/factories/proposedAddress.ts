import { faker } from '@faker-js/faker'
import { Factory } from 'fishery'
import { ProposedAddressDto } from '@sas/ui'

const housingArrangementTypes: ProposedAddressDto['housingArrangementType'][] = [
  'FRIENDS_OR_FAMILY',
  'SOCIAL_RENTED',
  'PRIVATE_RENTED_WHOLE_PROPERTY',
  'PRIVATE_RENTED_ROOM',
  'OWNED',
  'OTHER',
]

const settledTypes: ProposedAddressDto['settledType'][] = ['SETTLED', 'TRANSIENT']
const statuses: ProposedAddressDto['status'][] = ['NOT_CHECKED_YET', 'PASSED', 'FAILED']

export default Factory.define<ProposedAddressDto>(() => {
  const housingArrangementType = faker.helpers.arrayElement(housingArrangementTypes)

  return {
    housingArrangementType,
    housingArrangementTypeDescription: housingArrangementType === 'OTHER' ? faker.lorem.sentence() : '',
    settledType: faker.helpers.arrayElement(settledTypes),
    status: faker.helpers.arrayElement(statuses),
    address: {
      postcode: faker.location.zipCode(),
      subBuildingName: faker.location.secondaryAddress(),
      buildingName: faker.location.street(),
      buildingNumber: faker.location.buildingNumber(),
      thoroughfareName: faker.location.street(),
      dependentLocality: faker.location.city(),
      postTown: faker.location.city(),
      county: faker.location.state(),
      country: faker.location.country(),
      uprn: faker.string.alphanumeric({ length: 12 }),
    },
  }
})
