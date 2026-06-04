import { faker } from '@faker-js/faker'
import { AccommodationReferralDto as Referral } from '@sas/api'

type CasReferralStatus = Referral['status']

const statuses: CasReferralStatus[] = [
  'REJECTED',
  'NOT_ARRIVED',
  'REQUEST_WITHDRAW',
  'WITHDRAW',
  'EXPIRED',
  'REQUEST_REJECTED',
  'DEPARTED',
  'CANCELLED',
  'ARCHIVED',
]

export default (): CasReferralStatus => faker.helpers.arrayElement(statuses)
