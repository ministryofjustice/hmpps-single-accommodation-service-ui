import { faker } from '@faker-js/faker'
import { AccommodationReferralDto as Referral } from '@sas/api'

const casTypes: Referral['type'][] = ['CAS1', 'CAS2', 'CAS2v2', 'CAS3']

export default (): Referral['type'] => faker.helpers.arrayElement(casTypes)
