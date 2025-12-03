import { faker } from '@faker-js/faker'
import { Case } from '@sas/api'

const riskLevels = ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'] as const

export default (): Case['riskLevel'] => faker.helpers.arrayElement(riskLevels)
