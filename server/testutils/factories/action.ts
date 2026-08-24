import { Factory } from 'fishery'
import { CaseAction } from '@sas/api'
import { faker } from '@faker-js/faker'

const types: Readonly<CaseAction['type'][]> = [
  'CREATE_PLACEMENT',
  'PROVIDE_INFORMATION',
  'START_APPROVED_PREMISE_APPLICATION',
  'CONTINUE_APPROVED_PREMISE_APPLICATION',
  'START_CAS3_REFERRAL',
  'REPLY_TO_CAS3_BEDSPACE_OFFER',
  'SUBMIT_DTR_REFERRAL',
  'ADD_DTR_REFERRAL_DETAILS',
  'ADD_DTR_OUTCOME',
  'SUBMIT_CRS_ACCOMMODATION_REFERRAL',
  'SUBMIT_CRS_REFERRAL',
  'ADD_AND_CONFIRM_PROPOSED_ADDRESS',
]

export default Factory.define<CaseAction>(() => ({
  type: faker.helpers.arrayElement(types),
  startDate: faker.helpers.maybe(() => faker.date.future({ years: 2 }).toISOString().split('T')[0]),
}))
