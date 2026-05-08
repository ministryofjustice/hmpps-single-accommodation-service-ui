import { AssignedToDto } from '@sas/api'
import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'

export default Factory.define<AssignedToDto>(() => ({
  forename: faker.person.firstName(),
  surname: faker.person.lastName(),
  username: faker.internet.username(),
  staffCode: faker.string.numeric(6),
}))
