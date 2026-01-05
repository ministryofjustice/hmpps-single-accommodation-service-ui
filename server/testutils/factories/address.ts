import { Factory } from 'fishery'
import { faker } from '@faker-js/faker/locale/en_GB'
import { AddressDetails } from '@sas/api'

export default Factory.define<AddressDetails>(() => ({
  line1: faker.location.streetAddress(),
  line2: faker.helpers.maybe(() => faker.location.secondaryAddress()),
  region: faker.helpers.maybe(() => faker.location.county()),
  city: faker.location.city(),
  postcode: faker.location.zipCode(),
}))
