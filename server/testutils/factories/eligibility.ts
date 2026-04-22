import { EligibilityDto } from '@sas/api'
import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'
import crn from '../crn'
import serviceResultFactory from './serviceResult'

const caseActions = [
  'Confirm next address',
  'Add DTR outcome',
  'Add proposed address',
  'Start CAS3 referral',
  'Submit a CRS referral',
  'Consider home visit',
]

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
    caseActions: faker.helpers.arrayElements(caseActions, { min: 1, max: 3 }),
    ...allServiceResults,
  }
})
