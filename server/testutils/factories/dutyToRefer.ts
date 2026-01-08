import { faker } from '@faker-js/faker'
import { DutyToReferDto } from '@sas/api'
import { Factory } from 'fishery'
import crn from '../crn'

export default Factory.define<DutyToReferDto>(() => ({
  id: faker.string.uuid(),
  crn: crn(),
  submittedTo: faker.lorem.words(3),
  reference: faker.person.fullName(),
  submitted: faker.date.past().toISOString(),
  status: faker.helpers.arrayElement(['UPCOMING', 'NOT_ELIGIBLE', 'NOT_STARTED', 'SUBMITTED']),
}))
