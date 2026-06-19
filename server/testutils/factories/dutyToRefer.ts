import { faker } from '@faker-js/faker/locale/en_GB'
import { DtrSubmissionDto, DutyToReferDto } from '@sas/api'
import { Factory } from 'fishery'
import crn from '../crn'
import dtrSubmissionFactory from './dutyToReferSubmission'

export const statusToOutcomeReason = (status: DutyToReferDto['status']): DtrSubmissionDto['outcomeReason'] | null => {
  if (status === 'ACCEPTED') return faker.helpers.arrayElement(acceptedOutcomeReasons)
  if (status === 'NOT_ACCEPTED') return faker.helpers.arrayElement(notAcceptedOutcomeReasons)
  return null
}

export const notAcceptedOutcomeReasons: DtrSubmissionDto['outcomeReason'][] = [
  'NO_LOCAL_CONNECTION',
  'INTENTIONALLY_HOMELESS',
  'REJECTED_FOR_ANOTHER_REASON',
]
export const acceptedOutcomeReasons: DtrSubmissionDto['outcomeReason'][] = [
  'PREVENTION_AND_RELIEF_DUTY',
  'PRIORITY_NEED',
]

export const withdrawalReasons: DtrSubmissionDto['withdrawalReason'][] = [
  'NEW_REFERRAL',
  'INCORRECT_LOCAL_AUTHORITY',
  'NO_CONSENT',
  'DISENGAGED',
  'HOUSING_NEED_RESOLVED',
  'NOT_ELIGIBLE',
  'OTHER',
]

class DutyToReferFactory extends Factory<DutyToReferDto> {
  submitted() {
    const submissionNote = faker.datatype.boolean() ? faker.lorem.sentence() : undefined
    return this.params({
      status: 'SUBMITTED',
      submission: dtrSubmissionFactory.build({ outcomeReason: undefined, submissionNote }),
    })
  }

  accepted() {
    const outcomeReason = faker.helpers.arrayElement(acceptedOutcomeReasons)
    const outcomeNote = faker.datatype.boolean() ? faker.lorem.sentence() : undefined
    return this.params({ status: 'ACCEPTED', submission: dtrSubmissionFactory.build({ outcomeReason, outcomeNote }) })
  }

  notAccepted() {
    const outcomeReason = faker.helpers.arrayElement(notAcceptedOutcomeReasons)
    const outcomeNote = faker.datatype.boolean() ? faker.lorem.sentence() : undefined
    return this.params({
      status: 'NOT_ACCEPTED',
      submission: dtrSubmissionFactory.build({ outcomeReason, outcomeNote }),
    })
  }

  withdrawn() {
    const withdrawalReason = faker.helpers.arrayElement(withdrawalReasons)
    const withdrawalReasonOther = withdrawalReason === 'OTHER' ? faker.lorem.sentence() : undefined
    return this.params({
      status: 'WITHDRAWN',
      submission: dtrSubmissionFactory.build({ withdrawalReason, withdrawalReasonOther }),
    })
  }
}

export default DutyToReferFactory.define(() => {
  const status = faker.helpers.arrayElement(['SUBMITTED', 'WITHDRAWN', 'ACCEPTED', 'NOT_ACCEPTED'])
  const outcomeReason = statusToOutcomeReason(status)

  return {
    caseId: faker.string.uuid(),
    crn: crn(),
    status,
    submission: dtrSubmissionFactory.build({ outcomeReason }),
  }
})
