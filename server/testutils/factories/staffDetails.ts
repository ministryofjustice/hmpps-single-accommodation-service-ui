import { StaffDetailsDto } from '@sas/api'
import { Factory } from 'fishery'
import { faker } from '@faker-js/faker/locale/en_GB'

export default Factory.define<StaffDetailsDto>(() => ({
  name: faker.person.fullName(),
  username: faker.internet.username(),
  staffCode: faker.string.numeric(6),
}))
