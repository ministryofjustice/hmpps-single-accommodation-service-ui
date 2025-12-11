import { faker } from '@faker-js/faker'
import { CasReferralStatus } from '../@types/shared/models/CasReferralStatus'

const casTypes: CasReferralStatus[] = ['ACCEPTED', 'REJECTED', 'PENDING']

export default (): CasReferralStatus => faker.helpers.arrayElement(casTypes)
