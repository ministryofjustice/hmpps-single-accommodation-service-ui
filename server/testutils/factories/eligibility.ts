import { EligibilityDto } from '@sas/api'
import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'
import crn from '../crn'
import serviceResultFactory from './serviceResult'
import dtrServiceResultFactory from './dtrServiceResult'

const caseActions = [
  'Confirm next address',
  'Add DTR outcome',
  'Add proposed address',
  'Start CAS3 referral',
  'Submit a CRS referral',
  'Consider home visit',
]

export default Factory.define<EligibilityDto>(() => {
  return {
    crn: crn(),
    caseActions: faker.helpers.arrayElements(caseActions, { min: 1, max: 3 }),
    cas1: { serviceResult: serviceResultFactory.build() },
    cas3: { serviceResult: serviceResultFactory.build() },
    crs: { serviceResult: serviceResultFactory.build() },
    dtr: dtrServiceResultFactory.build(),
    pa: { serviceResult: serviceResultFactory.pa().build() },
  }
})
