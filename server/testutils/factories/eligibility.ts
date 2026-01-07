import { EligibilityDto } from '@sas/api'
import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'
import crn from '../crn'
import serviceResultFactory from './serviceResult'

export default Factory.define<EligibilityDto>(() => ({
  crn: crn(),
  caseStatus: faker.helpers.arrayElement(['NO_ACTION_NEEDED', 'ACTION_NEEDED', 'NO_ACTION_NEEDED']),
  caseActions: [],
  cas1: serviceResultFactory.build(),
  cas2Hdc: serviceResultFactory.build(),
  cas2CourtBail: serviceResultFactory.build(),
  cas2PrisonBail: serviceResultFactory.build(),
  cas3: serviceResultFactory.build(),
}))
