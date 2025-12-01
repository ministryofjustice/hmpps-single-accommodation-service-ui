import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'
import { Case } from '@sas/api'
import crn from '../crn'

export default Factory.define<Case>(() => ({
  name: faker.person.fullName(),
  crn: crn(),
}))
