import { faker } from '@faker-js/faker/locale/en_GB'
import { DutyToReferDto } from '@sas/api'
import { Factory } from 'fishery'
import crn from '../crn'
import dtrSubmissionFactory from './dutyToReferSubmission'

class DutyToReferFactory extends Factory<DutyToReferDto> {
  notStarted() {
    return this.params({
      status: 'NOT_STARTED',
      submission: null,
    })
  }

  submitted() {
    return this.params({ status: 'SUBMITTED', submission: dtrSubmissionFactory.build() })
  }

  accepted() {
    return this.params({ status: 'ACCEPTED', submission: dtrSubmissionFactory.build() })
  }

  notAccepted() {
    return this.params({ status: 'NOT_ACCEPTED', submission: dtrSubmissionFactory.build() })
  }
}

export default DutyToReferFactory.define(() => {
  const status = faker.helpers.arrayElement(['SUBMITTED', 'NOT_STARTED', 'ACCEPTED', 'NOT_ACCEPTED'])

  return {
    caseId: faker.string.uuid(),
    crn: crn(),
    status,
    submission: status !== 'NOT_STARTED' ? dtrSubmissionFactory.build() : undefined,
  }
})
