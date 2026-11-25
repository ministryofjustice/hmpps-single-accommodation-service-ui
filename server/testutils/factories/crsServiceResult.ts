import { Factory } from 'fishery'
import { CrsServiceResultWrapper, ServiceResultV2 } from '@sas/api'
import serviceResultFactory from './serviceResult'
import crsSubmissionFactory from './crsSubmission'

class CrsServiceResultFactory extends Factory<CrsServiceResultWrapper> {
  notRequired() {
    return this.params({
      serviceResult: serviceResultFactory.build({ serviceStatus: 'CRS_NOT_REQUIRED' }),
      commissionedRehabilitativeServices: null,
    })
  }

  notStarted() {
    return this.params({
      serviceResult: serviceResultFactory.build({ serviceStatus: 'CRS_NOT_STARTED_REFERRAL' }),
      commissionedRehabilitativeServices: null,
    })
  }

  submitted() {
    return this.params({
      serviceResult: serviceResultFactory.build({ serviceStatus: 'CRS_SUBMITTED' }),
      commissionedRehabilitativeServices: crsSubmissionFactory.build(),
    })
  }
}

const noSubmissionStatuses: Array<ServiceResultV2['serviceStatus']> = ['CRS_NOT_STARTED_REFERRAL', 'CRS_NOT_REQUIRED']

export default CrsServiceResultFactory.define(({ params }) => {
  const serviceResult = serviceResultFactory.crs().build(params.serviceResult)

  return {
    serviceResult,
    actionPosition: -1,
    commissionedRehabilitativeServices: noSubmissionStatuses.includes(serviceResult.serviceStatus)
      ? null
      : crsSubmissionFactory.build(),
  }
})
