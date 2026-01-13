import { faker } from '@faker-js/faker'
import { DutyToReferDto } from '@sas/api'
import { Factory } from 'fishery'
import crn from '../crn'

export default Factory.define<DutyToReferDto>(() => ({
  id: faker.string.uuid(),
  crn: crn(),
  submittedTo: `${faker.location.city()} Council`,
  reference: faker.string.alphanumeric(10).toUpperCase(),
  submitted: faker.date.past().toISOString(),
  status: faker.helpers.arrayElement(['UPCOMING', 'NOT_ELIGIBLE', 'NOT_STARTED', 'SUBMITTED']),
}))
