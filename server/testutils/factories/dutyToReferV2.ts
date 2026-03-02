import { faker } from '@faker-js/faker/locale/en_GB'
import { DutyToReferDto } from '@sas/ui'
import { Factory } from 'fishery'
import crn from '../crn'

class DutyToReferV2Factory extends Factory<DutyToReferDto> {
  notStarted() {
    return this.params({
      serviceStatus: 'NOT_STARTED',
      submission: null,
    })
  }

  submitted() {
    return this.params({
      serviceStatus: 'SUBMITTED',
      submission: {
        id: faker.string.uuid(),
        localAuthorityId: faker.string.uuid(),
        localAuthorityName: `${faker.location.city()} Council`,
        referenceNumber: faker.string.alphanumeric({ length: 10 }).toUpperCase(),
        submissionDate: faker.date.past().toISOString(),
        outcomeStatus: undefined,
        outcomeDate: undefined,
        createdBy: faker.person.fullName(),
        createdAt: faker.date.past().toISOString(),
        updatedAt: faker.date.recent().toISOString(),
      },
    })
  }

  accepted() {
    return this.params({
      serviceStatus: 'ACCEPTED',
      submission: {
        id: faker.string.uuid(),
        localAuthorityId: faker.string.uuid(),
        localAuthorityName: `${faker.location.city()} Council`,
        referenceNumber: faker.string.alphanumeric({ length: 10 }).toUpperCase(),
        submissionDate: faker.date.past().toISOString(),
        outcomeStatus: 'YES',
        outcomeDate: faker.date.past().toISOString(),
        createdBy: faker.person.fullName(),
        createdAt: faker.date.past().toISOString(),
        updatedAt: faker.date.recent().toISOString(),
      },
    })
  }

  notAccepted() {
    return this.params({
      serviceStatus: 'NOT_ACCEPTED',
      submission: {
        id: faker.string.uuid(),
        localAuthorityId: faker.string.uuid(),
        localAuthorityName: `${faker.location.city()} Council`,
        referenceNumber: faker.string.alphanumeric({ length: 10 }).toUpperCase(),
        submissionDate: faker.date.past().toISOString(),
        outcomeStatus: 'NO',
        outcomeDate: faker.date.past().toISOString(),
        createdBy: faker.person.fullName(),
        createdAt: faker.date.past().toISOString(),
        updatedAt: faker.date.recent().toISOString(),
      },
    })
  }
}

export default DutyToReferV2Factory.define(() => ({
  crn: crn(),
  serviceStatus: faker.helpers.arrayElement(['SUBMITTED', 'NOT_STARTED', 'ACCEPTED', 'NOT_ACCEPTED', undefined]),
  action: '',
  submission: {
    id: faker.string.uuid(),
    localAuthorityId: faker.string.uuid(),
    localAuthorityName: `${faker.location.city()} Council`,
    referenceNumber: faker.string.alphanumeric({ length: 10 }).toUpperCase(),
    submissionDate: faker.date.past().toISOString(),
    outcomeStatus: faker.helpers.arrayElement(['YES', 'NO']),
    outcomeDate: faker.helpers.arrayElement([faker.date.past().toISOString(), undefined]),
    createdBy: faker.person.fullName(),
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
  },
}))
