import { faker } from '@faker-js/faker/locale/en_GB'
import { DutyToReferDto } from '@sas/api'
import { Factory } from 'fishery'
import crn from '../crn'
import dtrSubmissionFactory from './dutyToReferSubmission'

class DutyToReferFactory extends Factory<DutyToReferDto> {
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
  return {
    caseId: faker.string.uuid(),
    crn: crn(),
    status: faker.helpers.arrayElement(['SUBMITTED', 'ACCEPTED', 'NOT_ACCEPTED', 'WITHDRAWN']),
    submission: dtrSubmissionFactory.build(),
  }
})
