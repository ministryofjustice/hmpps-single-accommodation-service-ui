import { faker } from '@faker-js/faker/locale/en_GB'
import { DtrSubmissionDto, DutyToReferDto } from '@sas/api'
import { Factory } from 'fishery'
import crn from '../crn'
import referenceDataFactory from './referenceData'

const submission = (overrides: Partial<DtrSubmissionDto> = {}): DtrSubmissionDto => {
  const localAuthority = referenceDataFactory.localAuthority().build()

  return {
    id: faker.string.uuid(),
      localAuthority: {
      localAuthorityAreaId: localAuthority.id,
        localAuthorityAreaName: faker.address.city(),
      },
    referenceNumber: faker.string.alphanumeric({ length: 10 }).toUpperCase(),
    submissionDate: faker.date.past().toISOString().split('T')[0],
    createdBy: faker.person.fullName(),
    createdAt: faker.date.past().toISOString(),
    ...overrides,
  }
}

class DutyToReferFactory extends Factory<DutyToReferDto> {
  notStarted() {
    return this.params({
      status: 'NOT_STARTED',
      submission: undefined,
    })
  }

  submitted() {
    return this.params({ status: 'SUBMITTED', submission: submission() })
  }

  accepted() {
    return this.params({ status: 'ACCEPTED', submission: submission() })
  }

  notAccepted() {
    return this.params({ status: 'NOT_ACCEPTED', submission: submission() })
  }
}

export default DutyToReferFactory.define(() => {
  return {
    crn: crn(),
    status: faker.helpers.arrayElement(['SUBMITTED', 'NOT_STARTED', 'ACCEPTED', 'NOT_ACCEPTED']),
    submission: submission(),
  }
})
