import { faker } from '@faker-js/faker/locale/en_GB'
import { ExternalReferralDto } from '@sas/api'
import { Factory } from 'fishery'
import crn from '../crn'
import externalReferralSubmissionFactory from './externalReferralSubmission'
import { withdrawalReasonLabels } from '../../utils/externalReferrals'

class ExternalReferralFactory extends Factory<ExternalReferralDto> {
  submitted() {
    return this.params({
      status: 'SUBMITTED',
      submission: externalReferralSubmissionFactory.submitted().build(),
    })
  }

  accepted() {
    return this.params({
      status: 'ACCEPTED',
    })
  }

  rejected() {
    return this.params({
      status: 'REJECTED',
    })
  }

  withdrawn() {
    return this.params({
      status: faker.helpers.arrayElement(['COMPLETED', 'ARCHIVED', 'REJECTED']),
      withdrawalReason: faker.helpers.arrayElement(
        Object.keys(withdrawalReasonLabels) as Array<ExternalReferralDto['withdrawalReason']>,
      ),
    })
  }
}

export default ExternalReferralFactory.define(() => {
  return {
    caseId: faker.string.uuid(),
    crn: crn(),
    status: 'SUBMITTED',
    submission: externalReferralSubmissionFactory.build(),
  }
})
