import { faker } from '@faker-js/faker'
import { CasType } from '@sas/api'

const casTypes: CasType[] = ['CAS1', 'CAS2', 'CAS2v2', 'CAS3']

export default (): CasType => faker.helpers.arrayElement(casTypes)
