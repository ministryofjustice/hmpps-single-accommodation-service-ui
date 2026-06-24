import { Factory } from 'fishery'
import { faker } from '@faker-js/faker/locale/en_GB'
import { DtrSubmissionDto, DutyToReferDto, AccommodationReferralDto as Referral } from '@sas/api'
import staffDetailsFactory from './staffDetails'
import { acceptedOutcomeReasons, notAcceptedOutcomeReasons, withdrawalReasons } from './dutyToReferSubmission'
import referenceDataFactory from './referenceData'

const statuses = ['ACCEPTED', 'REJECTED', 'PENDING', 'WITHDRAWN'] as Referral['status'][]

const cas1Statuses = [
  'CANCELLED',
  'DEPARTED',
  'NOT_ARRIVED',
  'REQUEST_WITHDRAWN',
  'REQUEST_REJECTED',
  'REJECTED',
  'WITHDRAWN',
  'EXPIRED',
]

const cas3Statuses = ['REJECTED', 'DEPARTED', 'CANCELLED', 'ARCHIVED']

const shortAddress = () => `${faker.location.street()}, ${faker.location.zipCode()}`

type ReferralParams = () => Partial<Referral>

const dtrReferrals: ReferralParams[] = [
  () => ({ status: 'ACCEPTED', placementStatus: faker.helpers.arrayElement(acceptedOutcomeReasons) }),
  () => ({ status: 'REJECTED', placementStatus: faker.helpers.arrayElement(notAcceptedOutcomeReasons) }),
  () => ({
    status: 'WITHDRAWN',
    placementStatus: 'WITHDRAWN',
    referralRejectionReason: faker.helpers.arrayElement(withdrawalReasons),
  }),
]

const cas1Referrals: ReferralParams[] = [
  () => ({ placementStatus: 'EXPIRED' }),
  () => ({ placementStatus: 'WITHDRAWN' }),
  () => ({ placementStatus: 'REJECTED', referralRejectionReason: 'Some rejection reason' }),
  () => ({ placementStatus: 'REQUEST_REJECTED' }),
  () => ({ placementStatus: 'REQUEST_WITHDRAWN', referralRejectionReason: 'Some request withdrawal reason' }),
  () => ({ placementStatus: 'NOT_ARRIVED', placementAddress: shortAddress() }),
  () => ({ placementStatus: 'DEPARTED', placementAddress: shortAddress() }),
  () => ({ placementStatus: 'CANCELLED', pdu: faker.location.city() }),
]

const cas3Referrals: ReferralParams[] = [
  () => ({
    status: 'REJECTED',
    placementStatus: 'REJECTED',
    referralRejectionReason: 'Local authority alternative suitable accommodation provided (includes Priority need)',
    referralRejectionReasonDetail: faker.lorem.words(40),
  }),
  () => ({ placementStatus: 'ARCHIVED' }),
  () => ({ placementStatus: 'DEPARTED', pdu: faker.location.city(), placementAddress: shortAddress() }),
  () => ({ placementStatus: 'CANCELLED', pdu: faker.location.city(), placementAddress: shortAddress() }),
]

export const statusToOutcomeReason = (status: DutyToReferDto['status']): DtrSubmissionDto['outcomeReason'] | null => {
  if (status === 'ACCEPTED') return faker.helpers.arrayElement(acceptedOutcomeReasons)
  if (status === 'NOT_ACCEPTED') return faker.helpers.arrayElement(notAcceptedOutcomeReasons)
  return null
}

class ReferralFactory extends Factory<Referral> {
  dtrReferral() {
    const status = faker.helpers.arrayElement(statuses)
    const outcomeReason = statusToOutcomeReason(status as DutyToReferDto['status'])
    const withdrawalReason = status === 'WITHDRAWN' ? faker.helpers.arrayElement(withdrawalReasons) : undefined
    const placementStatus = status === 'WITHDRAWN' ? 'WITHDRAWN' : outcomeReason
    const localAuthority = referenceDataFactory.localAuthority().build()

    return this.params({
      id: faker.string.uuid(),
      type: 'DTR',
      date: faker.date.past().toISOString(),
      referralRejectionReason: withdrawalReason,
      localAuthorityArea: localAuthority.name,
      pdu: null,
      placementAddress: null,
      status,
      placementStatus,
    })
  }

  cas1Referral() {
    return this.params({
      id: faker.string.uuid(),
      type: 'CAS1',
      date: faker.date.past().toISOString(),
      referralRejectionReason: undefined,
      localAuthorityArea: null,
      pdu: null,
      placementAddress: null,
      placementStatus: faker.helpers.arrayElement(cas1Statuses),
      status: faker.helpers.arrayElement(statuses),
    })
  }

  cas3Referral() {
    return this.params({
      id: faker.string.uuid(),
      type: 'CAS3',
      date: faker.date.past().toISOString(),
      referralRejectionReason: undefined,
      localAuthorityArea: null,
      pdu: null,
      placementAddress: null,
      placementStatus: faker.helpers.arrayElement(cas3Statuses),
      status: faker.helpers.arrayElement(statuses),
    })
  }

  randomReferral() {
    return faker.helpers.arrayElement([
      () => this.dtrReferral().params(faker.helpers.arrayElement(dtrReferrals)()),
      () => this.cas1Referral().params(faker.helpers.arrayElement(cas1Referrals)()),
      () => this.cas3Referral().params(faker.helpers.arrayElement(cas3Referrals)()),
    ])()
  }

  buildReferralHistoryList(count: number) {
    return Array.from({ length: count }, () => this.randomReferral().build())
  }
}

export default ReferralFactory.define(() => {
  return {
    id: faker.string.uuid(),
    type: 'CAS1' as const,
    status: 'ACCEPTED' as const,
    date: faker.date.past().toISOString(),
    referredBy: staffDetailsFactory.build(),
  }
})
