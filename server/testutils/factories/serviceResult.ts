import { ServiceResultV2 } from '@sas/api'
import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'

const cas1Statuses: Array<ServiceResultV2['serviceStatus']> = [
  'CAS1_NOT_ELIGIBLE',
  'CAS1_UPCOMING',
  'CAS1_NOT_STARTED',
  'CAS1_SUBMITTED',
]

const cas2Statuses: Array<ServiceResultV2['serviceStatus']> = [
  'CAS2_NOT_ELIGIBLE',
  'CAS2_NOT_STARTED',
  'CAS2_SUBMITTED',
]

const cas3Statuses: Array<ServiceResultV2['serviceStatus']> = [
  'CAS3_NOT_ELIGIBLE',
  'CAS3_NOT_STARTED',
  'CAS3_SUBMITTED',
]

const dtrStatuses: Array<ServiceResultV2['serviceStatus']> = [
  'DTR_NOT_REQUIRED',
  'DTR_UPCOMING',
  'DTR_NOT_STARTED',
  'DTR_SUBMITTED',
  'DTR_ACCEPTED',
  'DTR_NOT_ACCEPTED',
]

const crsStatuses: Array<ServiceResultV2['serviceStatus']> = [
  'CRS_NOT_REQUIRED',
  'CRS_NOT_STARTED_REFERRAL',
  'CRS_SUBMITTED',
]

const paStatuses: Array<ServiceResultV2['serviceStatus']> = ['PA_NOT_ELIGIBLE', 'PA_NOT_STARTED', 'PA_COMPLETED']

const ppcStatuses: Array<ServiceResultV2['serviceStatus']> = [
  'PPC_NOT_STARTED',
  'PPC_COMPLETED_PUBLIC_PROTECTION_REQUIRED',
  'PPC_COMPLETED_PUBLIC_PROTECTION_NOT_REQUIRED',
]

const allFailureReasons: ServiceResultV2['failureReasons'] = [
  'MALE_NOT_HIGH_RISK_TIER',
  'NON_MALE_NOT_HIGH_RISK_TIER',
  'INVALID_CURRENT_ACCOMMODATION_TYPE',
  'HAS_NEXT_ACCOMMODATION',
  'DTR_REFERRAL_EXPIRED',
  'SUITABLE_CAS1_APPLICATION',
  'SUITABLE_CAS3_APPLICATION',
]

class ServiceResultFactory extends Factory<ServiceResultV2> {
  cas1() {
    return this.params({ serviceStatus: faker.helpers.arrayElement(cas1Statuses) })
  }

  cas2() {
    return this.params({ serviceStatus: faker.helpers.arrayElement(cas2Statuses) })
  }

  cas3() {
    return this.params({ serviceStatus: faker.helpers.arrayElement(cas3Statuses) })
  }

  dtr() {
    return this.params({ serviceStatus: faker.helpers.arrayElement(dtrStatuses) })
  }

  crs() {
    return this.params({ serviceStatus: faker.helpers.arrayElement(crsStatuses) })
  }

  pa() {
    return this.params({ serviceStatus: faker.helpers.arrayElement(paStatuses) })
  }

  ppc() {
    return this.params({ serviceStatus: faker.helpers.arrayElement(ppcStatuses) })
  }
}

export default ServiceResultFactory.define(({ params }) => {
  const serviceStatus = params.serviceStatus || faker.helpers.arrayElement(cas1Statuses)
  const failureReasons = serviceStatus.includes('NOT_ELIGIBLE') ? [faker.helpers.arrayElement(allFailureReasons)] : []

  return {
    serviceStatus,
    failureReasons,
    url:
      serviceStatus.includes('NOT_ELIGIBLE') || serviceStatus.includes('UPCOMING') ? undefined : faker.internet.url(),
  }
})
