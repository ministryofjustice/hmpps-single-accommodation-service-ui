import { faker } from '@faker-js/faker/locale/en_GB'
import { DtrSubmissionDto, DutyToReferDto } from '@sas/api'
import { Factory } from 'fishery'
import crn from '../crn'
import { referenceDataFactory } from '.'

class DutyToReferFactory extends Factory<DutyToReferDto> {
  private submission(overrides: Partial<DtrSubmissionDto> = {}): DtrSubmissionDto {
    return {
      id: faker.string.uuid(),
      localAuthorityAreaId: faker.string.uuid(),
      referenceNumber: faker.string.alphanumeric({ length: 10 }).toUpperCase(),
      submissionDate: faker.date.past().toISOString().split('T')[0],
      createdBy: faker.person.fullName(),
      createdAt: faker.date.past().toISOString(),
      ...overrides,
    }
  }

  notStarted() {
    const localAuthority = referenceDataFactory.localAuthority().build()

    return this.params({
      status: 'NOT_STARTED',
    })
  }

  submitted() {
    return this.params({ status: 'SUBMITTED', submission: this.submission() })
  }

  accepted() {
    return this.params({ status: 'ACCEPTED', submission: this.submission() })
  }

  notAccepted() {
    return this.params({ status: 'NOT_ACCEPTED', submission: this.submission() })
  }
}

export default DutyToReferFactory.define(() => ({
  crn: crn(),
  status: faker.helpers.arrayElement(['SUBMITTED', 'NOT_STARTED', 'ACCEPTED', 'NOT_ACCEPTED']),
  submission: {
    id: faker.string.uuid(),
    localAuthorityAreaId: faker.string.uuid(),
    referenceNumber: faker.string.alphanumeric({ length: 10 }).toUpperCase(),
    submissionDate: faker.date.past().toISOString().split('T')[0],
    createdBy: faker.person.fullName(),
    createdAt: faker.date.past().toISOString(),
  },
}))
