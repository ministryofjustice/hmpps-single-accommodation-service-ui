import { faker } from '@faker-js/faker/locale/en_GB'
import { Factory } from 'fishery'
import { ProposedAddressFormData } from '@sas/ui'
import addressFactory from './accommodationAddressDetails'

const housingArrangementTypes: ProposedAddressFormData['housingArrangementType'][] = [
  'FRIENDS_OR_FAMILY',
  'SOCIAL_RENTED',
  'PRIVATE_RENTED_WHOLE_PROPERTY',
  'PRIVATE_RENTED_ROOM',
  'OWNED',
  'OTHER',
]

const settledTypes: ProposedAddressFormData['settledType'][] = ['SETTLED', 'TRANSIENT']
const statuses: ProposedAddressFormData['status'][] = ['NOT_CHECKED_YET', 'CHECKS_PASSED', 'CHECKS_FAILED', 'CONFIRMED']

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
  const housingArrangementType = faker.helpers.arrayElement(housingArrangementTypes)

  return {
    housingArrangementType,
    housingArrangementTypeDescription: housingArrangementType === 'OTHER' ? faker.lorem.sentence() : '',
    settledType: faker.helpers.arrayElement(settledTypes),
    status: faker.helpers.arrayElement(statuses),
    address: addressFactory.build(),
  }
})
