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

const dtrStatuses: Array<ServiceResult['serviceStatus']> = [
  'NOT_ELIGIBLE',
  'UPCOMING',
  'NOT_STARTED',
  'SUBMITTED',
  'ACCEPTED',
  'NOT_ACCEPTED',
]

const paStatuses: Array<ServiceResult['serviceStatus']> = ['NOT_ELIGIBLE', 'NOT_STARTED', 'COMPLETED']

const allFailureReasons: ServiceResult['failureReasons'] = [
  'S_TIER',
  'MALE_NOT_HIGH_RISK_TIER',
  'NON_MALE_NOT_HIGH_RISK_TIER',
  'SEX_DATA_NOT_AVAILABLE',
  'NO_CURRENT_ACCOMMODATION_END_DATE',
  'INVALID_CURRENT_ACCOMMODATION_TYPE',
  'CRS_EXPIRED',
  'CRS_NOT_SUBMITTED',
  'HAS_NEXT_ACCOMMODATION',
  'DTR_REFERRAL_EXPIRED',
  'INVALID_APPLICATION_STATE',
  'SUITABLE_CAS1_APPLICATION',
  'SUITABLE_CAS3_APPLICATION',
]

class ServiceResultFactory extends Factory<ServiceResult> {
  notEligible() {
    return this.params({ serviceStatus: 'NOT_ELIGIBLE', action: undefined })
  }

  dtr() {
    return this.params({ serviceStatus: faker.helpers.arrayElement(dtrStatuses) })
  }

  pa() {
    return this.params({ serviceStatus: faker.helpers.arrayElement(paStatuses) })
  }
}

export default ServiceResultFactory.define(({ params }) => {
  const serviceStatus = params.serviceStatus || faker.helpers.arrayElement(serviceStatuses)
  const failureReasons = serviceStatus === 'NOT_ELIGIBLE' ? [faker.helpers.arrayElement(allFailureReasons)] : []

  return {
    serviceStatus,
    action: faker.helpers.maybe(() => faker.lorem.words(5)),
    failureReasons,
  }
})
