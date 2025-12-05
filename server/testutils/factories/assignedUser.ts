import { AssignedToDto } from '@sas/api'
import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'

export default Factory.define<AssignedToDto>(() => ({
  id: faker.number.int(),
  name: faker.person.fullName(),
}))
