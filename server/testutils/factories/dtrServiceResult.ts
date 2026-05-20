import { faker } from '@faker-js/faker/locale/en_GB'
import { DtrServiceResult, ServiceResult } from '@sas/api'
import { Factory } from 'fishery'
import serviceResultFactory from './serviceResult'
import dtrSubmissionFactory from './dutyToReferSubmission'

class DtrServiceResultFactory extends Factory<DtrServiceResult> {
  notEligible() {
    return this.params({
      serviceResult: serviceResultFactory.build({ serviceStatus: 'NOT_ELIGIBLE' }),
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

const noSubmissionStatuses: Array<ServiceResult['serviceStatus']> = ['NOT_STARTED', 'NOT_ELIGIBLE', 'UPCOMING']

export default DtrServiceResultFactory.define(() => {
  const status = faker.helpers.arrayElement([
    'SUBMITTED',
    'NOT_STARTED',
    'ACCEPTED',
    'NOT_ACCEPTED',
    'NOT_ELIGIBLE',
    'UPCOMING',
  ])
  return {
    serviceResult: serviceResultFactory.build({ serviceStatus: status }),
    submission: noSubmissionStatuses.includes(status) ? null : dtrSubmissionFactory.build(),
  }
})
