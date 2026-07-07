import { DtrServiceResult, ServiceResult } from '@sas/api'
import { Factory } from 'fishery'
import serviceResultFactory from './serviceResult'
import dtrSubmissionFactory from './dutyToReferSubmission'

class DtrServiceResultFactory extends Factory<DtrServiceResult> {
  notRequired() {
    return this.params({
      serviceResult: serviceResultFactory.build({ serviceStatus: 'NOT_REQUIRED' }),
      submission: null,
    })
  }

  upcoming() {
    return this.params({
      serviceResult: serviceResultFactory.build({ serviceStatus: 'UPCOMING' }),
      submission: null,
    })
  }

  notStarted() {
    return this.params({
      serviceResult: serviceResultFactory.build({ serviceStatus: 'NOT_STARTED' }),
      submission: null,
    })
  }

  submitted() {
    return this.params({
      serviceResult: serviceResultFactory.build({ serviceStatus: 'SUBMITTED' }),
      submission: dtrSubmissionFactory.build(),
    })
  }

  accepted() {
    return this.params({
      serviceResult: serviceResultFactory.build({ serviceStatus: 'ACCEPTED' }),
      submission: dtrSubmissionFactory.build(),
    })
  }

  notAccepted() {
    return this.params({
      serviceResult: serviceResultFactory.build({ serviceStatus: 'NOT_ACCEPTED' }),
      submission: dtrSubmissionFactory.build(),
    })
  }
}

const noSubmissionStatuses: Array<ServiceResult['serviceStatus']> = ['NOT_STARTED', 'NOT_REQUIRED', 'UPCOMING']

export default DtrServiceResultFactory.define(() => {
  const serviceResult = serviceResultFactory.dtr().build()
  return {
    serviceResult,
    submission: noSubmissionStatuses.includes(serviceResult.serviceStatus) ? null : dtrSubmissionFactory.build(),
  }
})
