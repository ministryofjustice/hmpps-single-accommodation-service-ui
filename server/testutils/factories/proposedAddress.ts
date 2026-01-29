import { faker } from '@faker-js/faker'
import { Factory } from 'fishery'
import { ProposedAddressDto } from '@sas/ui'
import addressFactory from './accommodationAddressDetails'

const housingArrangementTypes: ProposedAddressDto['housingArrangementType'][] = [
  'FRIENDS_OR_FAMILY',
  'SOCIAL_RENTED',
  'PRIVATE_RENTED_WHOLE_PROPERTY',
  'PRIVATE_RENTED_ROOM',
  'OWNED',
  'OTHER',
]

const settledTypes: ProposedAddressDto['settledType'][] = ['SETTLED', 'TRANSIENT']
const statuses: ProposedAddressDto['status'][] = ['NOT_CHECKED_YET', 'CHECKS_PASSED', 'CHECKS_FAILED', 'CONFIRMED']

export default Factory.define<ProposedAddressDto>(() => {
  const housingArrangementType = faker.helpers.arrayElement(housingArrangementTypes)

  return {
    housingArrangementType,
    housingArrangementTypeDescription: housingArrangementType === 'OTHER' ? faker.lorem.sentence() : '',
    settledType: faker.helpers.arrayElement(settledTypes),
    status: faker.helpers.arrayElement(statuses),
    address: addressFactory.build(),
  }
})
