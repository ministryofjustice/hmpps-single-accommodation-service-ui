import { faker } from '@faker-js/faker/locale/en_GB'
import { DtrSubmissionDto, DutyToReferDto } from '@sas/api'
import { Factory } from 'fishery'
import referenceDataFactory from './referenceData'

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

class DtrSubmissionFactory extends Factory<DtrSubmissionDto> {
  submitted() {
    const submissionNote = faker.helpers.maybe(() => faker.lorem.sentence())
    return this.params({
      outcomeReason: undefined,
      outcomeNote: undefined,
      withdrawalReason: undefined,
      withdrawalReasonOther: undefined,
      submissionNote,
    })
  }

  accepted() {
    const outcomeReason = faker.helpers.arrayElement(acceptedOutcomeReasons)
    const outcomeNote = faker.helpers.maybe(() => faker.lorem.sentence())
    return this.params({ outcomeReason, outcomeNote, withdrawalReason: undefined, withdrawalReasonOther: undefined })
  }

  notAccepted() {
    const outcomeReason = faker.helpers.arrayElement(notAcceptedOutcomeReasons)
    const outcomeNote = faker.helpers.maybe(() => faker.lorem.sentence())
    return this.params({
      outcomeReason,
      outcomeNote,
      withdrawalReason: undefined,
      withdrawalReasonOther: undefined,
    })
  }

  withdrawn() {
    const withdrawalReason = faker.helpers.arrayElement(withdrawalReasons)
    const withdrawalReasonOther = withdrawalReason === 'OTHER' ? faker.lorem.sentence() : undefined
    return this.params({
      withdrawalReason,
      withdrawalReasonOther,
    })
  }

  withStatus(status: DutyToReferDto['status']) {
    switch (status) {
      case 'ACCEPTED':
        return this.accepted()
      case 'NOT_ACCEPTED':
        return this.notAccepted()
      case 'WITHDRAWN':
        return this.withdrawn()
      default:
        return this.submitted()
    }
  }
}

export default DtrSubmissionFactory.define(() => {
  const localAuthority = referenceDataFactory.localAuthority().build()

  return {
    id: faker.string.uuid(),
    localAuthority: {
      localAuthorityAreaId: localAuthority.id,
      localAuthorityAreaName: localAuthority.name,
    },
    referenceNumber: faker.string.alphanumeric({ length: 10 }).toUpperCase(),
    submissionDate: faker.date.recent({ days: 180 }).toISOString().split('T')[0],
    createdBy: faker.person.fullName(),
    createdAt: faker.date.recent().toISOString(),
  }
})
