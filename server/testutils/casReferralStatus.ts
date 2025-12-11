import { faker } from '@faker-js/faker'
import { AccommodationReferralDto as Referral } from '@sas/api'

type CasReferralStatus = Referral['status']

const statuses: CasReferralStatus[] = ['ACCEPTED', 'REJECTED', 'PENDING']

export default (): CasReferralStatus => faker.helpers.arrayElement(statuses)
