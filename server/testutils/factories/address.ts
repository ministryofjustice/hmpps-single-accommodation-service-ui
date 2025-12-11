import { Factory } from 'fishery'
import { AddressDto } from '@sas/ui'
import { faker } from '@faker-js/faker/locale/en_GB'

export default Factory.define<AddressDto>(() => ({
  line1: faker.location.streetAddress(),
  line2: faker.helpers.maybe(() => faker.location.secondaryAddress()),
  region: faker.helpers.maybe(() => faker.location.county()),
  city: faker.location.city(),
  postcode: faker.location.zipCode(),
}))
