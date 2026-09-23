import { faker } from '@faker-js/faker/locale/en_GB'
import { Factory } from 'fishery'
import { OtherAccommodationReferralCommand } from '@sas/api'

const dateWithoutTime = () => faker.date.past().toISOString().split('T')[0]

export default Factory.define<OtherAccommodationReferralCommand>(() => ({
  localAuthorityAreaId: faker.string.uuid(),
  submissionDate: dateWithoutTime(),
  referenceNumber: faker.string.alphanumeric({ length: 10 }).toUpperCase(),
  status: 'SUBMITTED',
  organisationName: faker.company.name(),
  website: faker.internet.url(),
  submissionNote: faker.lorem.paragraph(),
}))
