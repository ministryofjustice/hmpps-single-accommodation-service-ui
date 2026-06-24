import { faker } from '@faker-js/faker/locale/en_GB'
import { DutyToReferDto } from '@sas/api'
import { Factory } from 'fishery'
import crn from '../crn'
import dtrSubmissionFactory from './dutyToReferSubmission'

class DutyToReferFactory extends Factory<DutyToReferDto> {
  submitted() {
    return this.params({
      status: 'SUBMITTED',
      submission: dtrSubmissionFactory.submitted().build(),
    })
  }

  accepted() {
    return this.params({ status: 'ACCEPTED', submission: dtrSubmissionFactory.accepted().build() })
  }

  notAccepted() {
    return this.params({
      status: 'NOT_ACCEPTED',
      submission: dtrSubmissionFactory.notAccepted().build(),
    })
  }

  withdrawn() {
    return this.params({
      status: 'WITHDRAWN',
      submission: dtrSubmissionFactory.withdrawn().build(),
    })
  }
}

export default DutyToReferFactory.define(() => {
  const status = faker.helpers.arrayElement(['SUBMITTED', 'WITHDRAWN', 'ACCEPTED', 'NOT_ACCEPTED'])

  return {
    caseId: faker.string.uuid(),
    crn: crn(),
    status,
    submission: dtrSubmissionFactory.withStatus(status).build(),
  }
})
