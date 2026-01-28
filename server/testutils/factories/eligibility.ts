import { EligibilityDto } from '@sas/api'
import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'
import crn from '../crn'
import serviceResultFactory from './serviceResult'

export default Factory.define<EligibilityDto>(() => {
  const allServiceResults = {
    cas1: serviceResultFactory.notEligible().build(),
    cas2Hdc: serviceResultFactory.notEligible().build(),
    cas2CourtBail: serviceResultFactory.notEligible().build(),
    cas2PrisonBail: serviceResultFactory.notEligible().build(),
    cas3: serviceResultFactory.notEligible().build(),
  }

  const eligibleService = faker.helpers.arrayElement(Object.keys(allServiceResults)) as keyof typeof allServiceResults
  allServiceResults[eligibleService] = serviceResultFactory.build()

  return {
    crn: crn(),
    caseStatus: faker.helpers.arrayElement(['NO_ACTION_REQUIRED', 'ACTION_NEEDED', 'ACTION_UPCOMING']),
    caseActions: [],
    ...allServiceResults,
  }
})
