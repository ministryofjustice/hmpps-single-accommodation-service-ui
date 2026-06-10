import { Factory } from 'fishery'
import { CommissionedRehabilitativeServicesDto } from '@sas/api'
import { faker } from '@faker-js/faker'

const statuses: CommissionedRehabilitativeServicesDto['status'][] = ['LIVE', 'DRAFT', 'COMPLETED', 'WITHDRAWN']

export default Factory.define<CommissionedRehabilitativeServicesDto>(() => {
  const status = faker.helpers.arrayElement(statuses)

  return {
    status,
    submissionDate: status !== 'DRAFT' ? faker.date.past().toISOString().split('T')[0] : null,
  }
})
