import { faker } from '@faker-js/faker/locale/en_GB'
import { DtrSubmissionDto, DutyToReferDto } from '@sas/api'
import { Factory } from 'fishery'
import crn from '../crn'
import dtrSubmissionFactory from './dutyToReferSubmission'

const statusToOutcomeReason = (status: DutyToReferDto['status']): DtrSubmissionDto['outcomeReason'] | null => {
  if (status === 'ACCEPTED') return faker.helpers.arrayElement(acceptedOutcomeReasons)
  if (status === 'NOT_ACCEPTED') return faker.helpers.arrayElement(notAcceptedOutcomeReasons)
  return null
}

const notAcceptedOutcomeReasons: DtrSubmissionDto['outcomeReason'][] = [
  'NO_LOCAL_CONNECTION',
  'INTENTIONALLY_HOMELESS',
  'REJECTED_FOR_ANOTHER_REASON',
]
const acceptedOutcomeReasons: DtrSubmissionDto['outcomeReason'][] = ['PREVENTION_AND_RELIEF_DUTY', 'PRIORITY_NEED']

class DutyToReferFactory extends Factory<DutyToReferDto> {
  submitted() {
    return this.params({ status: 'SUBMITTED', submission: dtrSubmissionFactory.build({ outcomeReason: null }) })
  }

  accepted() {
    const outcomeReason = faker.helpers.arrayElement(acceptedOutcomeReasons)
    return this.params({ status: 'ACCEPTED', submission: dtrSubmissionFactory.build({ outcomeReason }) })
  }

  notAccepted() {
    const outcomeReason = faker.helpers.arrayElement(notAcceptedOutcomeReasons)
    return this.params({ status: 'NOT_ACCEPTED', submission: dtrSubmissionFactory.build({ outcomeReason }) })
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
