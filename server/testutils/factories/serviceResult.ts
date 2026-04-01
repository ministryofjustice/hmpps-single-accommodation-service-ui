import { ServiceResult } from '@sas/api'
import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'

const serviceStatuses: Array<ServiceResult['serviceStatus']> = [
  'NOT_ELIGIBLE',
  'UPCOMING',
  'NOT_STARTED',
  'REJECTED',
  'WITHDRAWN',
  'SUBMITTED',
  'CONFIRMED',
]

class ServiceResultFactory extends Factory<ServiceResult> {
  notEligible() {
    return this.params({ serviceStatus: 'NOT_ELIGIBLE', action: undefined, suitableApplicationId: undefined })
  }
}

export default ServiceResultFactory.define(() => ({
  serviceStatus: faker.helpers.arrayElement(serviceStatuses),
  action: faker.helpers.maybe(() => faker.lorem.words(5)),
}))
