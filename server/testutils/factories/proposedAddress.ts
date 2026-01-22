import { Factory } from 'fishery'
import { faker } from '@faker-js/faker/locale/en_GB'
import { ProposedAddressDto } from '@sas/ui'
import addressDetailsFactory from './addressDetails'

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
    id: faker.string.uuid(),
    housingArrangementType,
    housingArrangementTypeDescription: housingArrangementType === 'OTHER' ? faker.lorem.sentence() : '',
    settledType: faker.helpers.arrayElement(settledTypes),
    status: faker.helpers.arrayElement(statuses),
    address: addressDetailsFactory.build(),
    createdAt: faker.date.recent().toISOString(),
  }
})
