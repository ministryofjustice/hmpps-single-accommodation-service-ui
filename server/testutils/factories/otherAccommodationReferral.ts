import { faker } from '@faker-js/faker/locale/en_GB'
import { OtherAccommodationReferralDto } from '@sas/api'
import { Factory } from 'fishery'
import crn from '../crn'
import otherAccommodationReferralSubmissionFactory from './otherAccommodationReferralSubmission'

class OtherAccommodationReferralFactory extends Factory<OtherAccommodationReferralDto> {
  submitted() {
    return this.params({
      status: 'SUBMITTED',
      submission: otherAccommodationReferralSubmissionFactory.submitted().build(),
    })
  }
}

export default OtherAccommodationReferralFactory.define(() => {
  return {
    caseId: faker.string.uuid(),
    crn: crn(),
    status: 'SUBMITTED' as const,
    submission: otherAccommodationReferralSubmissionFactory.build(),
  }
})
