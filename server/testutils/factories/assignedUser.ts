import { AssignedToDto } from '@sas/api'
import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'

export default Factory.define<AssignedToDto>(() => ({
  name: faker.person.fullName(),
  username: faker.internet.username(),
}))
