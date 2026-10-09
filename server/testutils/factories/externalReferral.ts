import { faker } from '@faker-js/faker/locale/en_GB'
import { ExternalReferralDto } from '@sas/api'
import { Factory } from 'fishery'
import crn from '../crn'
import externalReferralSubmissionFactory from './externalReferralSubmission'

class ExternalReferralFactory extends Factory<ExternalReferralDto> {
  submitted() {
    return this.params({
      status: 'SUBMITTED',
    })
  }
}

export default ExternalReferralFactory.define(() => {
  return {
    caseId: faker.string.uuid(),
    crn: crn(),
    status: 'SUBMITTED' as const,
    submission: externalReferralSubmissionFactory.build(),
  }
})
