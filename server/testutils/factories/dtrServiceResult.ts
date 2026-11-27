import { DtrServiceResultWrapper, ServiceResultV2 } from '@sas/api'
import { Factory } from 'fishery'
import serviceResultFactory from './serviceResult'
import dtrSubmissionFactory from './dutyToReferSubmission'

class DtrServiceResultFactory extends Factory<DtrServiceResultWrapper> {
  notRequired() {
    return this.params({
      serviceResult: serviceResultFactory.build({ serviceStatus: 'DTR_NOT_REQUIRED' }),
      submission: null,
    })
  }

  upcoming() {
    return this.params({
      serviceResult: serviceResultFactory.build({ serviceStatus: 'DTR_UPCOMING' }),
      submission: null,
    })
  }

  notStarted() {
    return this.params({
      serviceResult: serviceResultFactory.build({ serviceStatus: 'DTR_NOT_STARTED' }),
      submission: null,
    })
  }

  submitted() {
    return this.params({
      serviceResult: serviceResultFactory.build({ serviceStatus: 'DTR_SUBMITTED' }),
      submission: dtrSubmissionFactory.build(),
    })
  }

  accepted() {
    return this.params({
      serviceResult: serviceResultFactory.build({ serviceStatus: 'DTR_ACCEPTED' }),
      submission: dtrSubmissionFactory.build(),
    })
  }

  notAccepted() {
    return this.params({
      serviceResult: serviceResultFactory.build({ serviceStatus: 'DTR_NOT_ACCEPTED' }),
      submission: dtrSubmissionFactory.build(),
    })
  }
}

const noSubmissionStatuses: Array<ServiceResultV2['serviceStatus']> = [
  'DTR_NOT_STARTED',
  'DTR_NOT_REQUIRED',
  'DTR_UPCOMING',
]
export default DtrServiceResultFactory.define(({ params }) => {
  const serviceResult = serviceResultFactory.dtr().build(params.serviceResult)
  return {
    serviceResult,
    actionPosition: -1,
    submission: noSubmissionStatuses.includes(serviceResult.serviceStatus) ? null : dtrSubmissionFactory.build(),
  }
})
