import { Factory } from 'fishery'
import { CrsServiceResult, ServiceResult } from '@sas/api'
import serviceResultFactory from './serviceResult'
import crsSubmissionFactory from './crsSubmission'

class CrsServiceResultFactory extends Factory<CrsServiceResult> {
  notEligible() {
    return this.params({
      serviceResult: serviceResultFactory.build({ serviceStatus: 'NOT_ELIGIBLE' }),
      commissionedRehabilitativeServices: null,
    })
  }

  notStarted() {
    return this.params({
      serviceResult: serviceResultFactory.build({ serviceStatus: 'NOT_STARTED' }),
      commissionedRehabilitativeServices: null,
    })
  }

  submitted() {
    return this.params({
      serviceResult: serviceResultFactory.build({ serviceStatus: 'SUBMITTED' }),
      commissionedRehabilitativeServices: crsSubmissionFactory.build(),
    })
  }
}

const noSubmissionStatuses: Array<ServiceResult['serviceStatus']> = ['NOT_STARTED', 'NOT_ELIGIBLE']

export default CrsServiceResultFactory.define(() => {
  const serviceResult = serviceResultFactory.crs().build()

  return {
    serviceResult,
    commissionedRehabilitativeServices: noSubmissionStatuses.includes(serviceResult.serviceStatus)
      ? null
      : crsSubmissionFactory.build(),
  }
})
