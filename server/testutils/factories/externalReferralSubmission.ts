import { faker } from '@faker-js/faker/locale/en_GB'
import { ExternalReferralSubmissionDto } from '@sas/api'
import { Factory } from 'fishery'

class ExternalReferralSubmissionFactory extends Factory<ExternalReferralSubmissionDto> {
  submitted() {
    return this.params({
      submissionNote: faker.helpers.maybe(() => faker.lorem.paragraph()),
    })
  }
}

export default ExternalReferralSubmissionFactory.define(() => {
  return {
    id: faker.string.uuid(),
    organisationName: faker.company.name(),
    referenceNumber: faker.string.alphanumeric({ length: 10 }).toUpperCase(),
    submissionDate: faker.date.recent({ days: 180 }).toISOString().split('T')[0],
    website: faker.internet.url(),
    email: faker.internet.email(),
    phoneNumber: faker.phone.number({ style: 'mobile' }),
    createdByUsername: faker.internet.username(),
    createdBy: faker.person.fullName(),
    createdAt: faker.date.recent().toISOString(),
  }
})
