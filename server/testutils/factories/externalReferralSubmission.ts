import { faker } from '@faker-js/faker/locale/en_GB'
import { ExternalReferralSubmissionDto } from '@sas/api'
import { Factory } from 'fishery'

class ExternalReferralSubmissionFactory extends Factory<ExternalReferralSubmissionDto> {
  submitted() {
    return this.params({
      outcomeNote: undefined,
    })
  }
}

export default ExternalReferralSubmissionFactory.define(() => {
  return {
    id: faker.string.uuid(),
    organisationName: faker.company.name(),
    referenceNumber: faker.helpers.maybe(() => faker.string.alphanumeric({ length: 10 }).toUpperCase()),
    submissionDate: faker.date.recent({ days: 180 }).toISOString().split('T')[0],
    website: faker.helpers.maybe(() => faker.internet.url()),
    email: faker.helpers.maybe(() => faker.internet.email()),
    phoneNumber: faker.helpers.maybe(() => faker.phone.number()),
    createdByUsername: faker.internet.username(),
    createdBy: faker.person.fullName(),
    createdAt: faker.date.recent().toISOString(),
    submissionNote: faker.helpers.maybe(() => faker.lorem.paragraph()),
    outcomeNote: faker.helpers.maybe(() => faker.lorem.paragraph()),
  }
})
