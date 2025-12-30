import { ServiceResult } from '@sas/api'
import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'

const serviceStatuses: Array<ServiceResult['serviceStatus']> = [
  'NOT_STARTED',
  'NOT_ELIGIBLE',
  'UPCOMING',
  'AWAITING_ASSESSMENT',
  'UNALLOCATED_ASSESSMENT',
  'ASSESSMENT_IN_PROGRESS',
  'AWAITING_PLACEMENT',
  'REQUEST_FOR_FURTHER_INFORMATION',
  'PENDING_PLACEMENT_REQUEST',
  'ARRIVED',
  'UPCOMING_PLACEMENT',
  'DEPARTED',
  'NOT_ARRIVED',
  'CANCELLED',
]

const actions = ['Action1!', 'Action2!', 'Action3!', 'Action4!']

export default Factory.define<ServiceResult>(() => ({
  serviceStatus: faker.helpers.arrayElement(serviceStatuses),
  actions: faker.helpers.arrayElements(actions, { min: 0, max: 3 }),
}))
