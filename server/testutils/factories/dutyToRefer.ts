import { faker } from '@faker-js/faker/locale/en_GB'
import { DtrCommand, DutyToReferDto } from '@sas/api'
import { Factory } from 'fishery'
import crn from '../crn'
import dtrSubmissionFactory from './dutyToReferSubmission'

class DutyToReferFactory extends Factory<DutyToReferDto> {
  notStarted() {
    return this.params({
      status: 'NOT_STARTED',
      submission: undefined,
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

  fromSubmission(command: DtrCommand, localAuthorityAreaName: string) {
    return this.params({
      status: command.status,
      submission: dtrSubmissionFactory.build({
        submissionDate: command.submissionDate,
        referenceNumber: command.referenceNumber,
        localAuthority: {
          localAuthorityAreaId: command.localAuthorityAreaId,
          localAuthorityAreaName,
        },
      }),
    })
  }
}

export default DutyToReferFactory.define(() => {
  return {
    crn: crn(),
    status: faker.helpers.arrayElement(['SUBMITTED', 'NOT_STARTED', 'ACCEPTED', 'NOT_ACCEPTED']),
    submission: dtrSubmissionFactory.build(),
  }
})
