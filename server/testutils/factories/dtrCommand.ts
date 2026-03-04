import { faker } from '@faker-js/faker/locale/en_GB'
import { Factory } from 'fishery'
import { DtrCommand } from '@sas/api'

const dateWithoutSeconds = () => faker.date.past().toISOString().split('T')[0]

export default Factory.define<DtrCommand>(() => ({
  localAuthorityAreaId: faker.string.uuid(),
  submissionDate: dateWithoutSeconds(),
  referenceNumber: faker.string.alphanumeric({ length: 10 }).toUpperCase(),
  status: 'SUBMITTED',
}))
