import { faker } from '@faker-js/faker/locale/en_GB'
import { DtrSubmissionDto } from '@sas/api'
import { Factory } from 'fishery'
import referenceDataFactory from './referenceData'

export default Factory.define<DtrSubmissionDto>(() => {
  const localAuthority = referenceDataFactory.localAuthority().build()

  return {
    id: faker.string.uuid(),
    localAuthority: {
      localAuthorityAreaId: localAuthority.id,
      localAuthorityAreaName: localAuthority.name,
    },
    referenceNumber: faker.string.alphanumeric({ length: 10 }).toUpperCase(),
    submissionDate: faker.date.past().toISOString().split('T')[0],
    createdBy: faker.person.fullName(),
    createdAt: faker.date.past().toISOString(),
  }
})
