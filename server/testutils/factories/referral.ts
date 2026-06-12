import { Factory } from 'fishery'
import { faker } from '@faker-js/faker/locale/en_GB'
import { DutyToReferDto, AccommodationReferralDto as Referral } from '@sas/api'
import staffDetailsFactory from './staffDetails'
import { acceptedOutcomeReasons, notAcceptedOutcomeReasons, statusToOutcomeReason, withdrawalReasons } from './dutyToRefer'
import referenceDataFactory from './referenceData'

const statuses = ['ACCEPTED', 'REJECTED', 'PENDING', 'WITHDRAWN'] as const

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

  dtrReferralAccepted() {
    const outcomeReason = faker.helpers.arrayElement(acceptedOutcomeReasons)
    return this.dtrReferral().params({ status: 'ACCEPTED', placementStatus: outcomeReason })
  }

  dtrReferralNotAccepted() {
    const outcomeReason = faker.helpers.arrayElement(notAcceptedOutcomeReasons)
    return this.dtrReferral().params({ status: 'REJECTED', placementStatus: outcomeReason })
  }

  dtrReferralWithdrawn() {
    const withdrawalReason = faker.helpers.arrayElement(withdrawalReasons)
    return this.dtrReferral().params({
      status: 'WITHDRAWN',
      placementStatus: 'WITHDRAWN',
      referralRejectionReason: withdrawalReason,
    })
  }

  randomDtrReferral() {
    return faker.helpers.arrayElement([
      () => this.dtrReferralAccepted(),
      () => this.dtrReferralNotAccepted(),
      () => this.dtrReferralWithdrawn(),
    ])()
  }

  cas1Application() {
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

  cas1ApplicationExpired() {
    return this.cas1Application().params({ placementStatus: 'EXPIRED' })
  }

  cas1ApplicationWithdrawn() {
    return this.cas1Application().params({ placementStatus: 'WITHDRAWN' })
  }

  cas1ApplicationRejected(reason = 'Some rejection reason') {
    return this.cas1Application().params({ placementStatus: 'REJECTED', referralRejectionReason: reason })
  }

  cas1PlacementRequestRejected() {
    return this.cas1Application().params({ placementStatus: 'REQUEST_REJECTED' })
  }

  cas1PlacementRequestWithdrawn(reason = 'Some request withdrawal reason') {
    return this.cas1Application().params({ placementStatus: 'REQUEST_WITHDRAWN', referralRejectionReason: reason })
  }

  cas1PlacementNotArrived() {
    return this.cas1Application().params({ placementStatus: 'NOT_ARRIVED', placementAddress: shortAddress() })
  }

  cas1PlacementDeparted() {
    return this.cas1Application().params({ placementStatus: 'DEPARTED', placementAddress: shortAddress() })
  }

  cas1PlacementCancelled() {
    return this.cas1Application().params({ placementStatus: 'CANCELLED', pdu: faker.location.city() })
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

  cas3ReferralRejected(
    reason = 'Local authority alternative suitable accommodation provided (includes Priority need)',
  ) {
    return this.cas3Referral().params({
      status: 'REJECTED',
      placementStatus: 'REJECTED',
      referralRejectionReason: reason,
      referralRejectionReasonDetail: faker.lorem.words(40),
    })
  }

  cas3ReferralArchived() {
    return this.cas3Referral().params({ placementStatus: 'ARCHIVED' })
  }

  cas3BookingDeparted() {
    return this.cas3Referral().params({
      placementStatus: 'DEPARTED',
      pdu: faker.location.city(),
      placementAddress: shortAddress(),
    })
  }

  cas3BookingCancelled() {
    return this.cas3Referral().params({
      placementStatus: 'CANCELLED',
      placementAddress: shortAddress(),
      pdu: faker.location.city(),
    })
  }

  randomCas1Referral() {
    return faker.helpers.arrayElement([
      () => this.cas1ApplicationExpired(),
      () => this.cas1ApplicationWithdrawn(),
      () => this.cas1ApplicationRejected(),
      () => this.cas1PlacementRequestRejected(),
      () => this.cas1PlacementRequestWithdrawn(),
      () => this.cas1PlacementNotArrived(),
      () => this.cas1PlacementDeparted(),
      () => this.cas1PlacementCancelled(),
    ])()
  }

  randomCas3Referral() {
    return faker.helpers.arrayElement([
      () => this.cas3ReferralRejected(),
      () => this.cas3ReferralArchived(),
      () => this.cas3BookingDeparted(),
      () => this.cas3BookingCancelled(),
    ])()
  }

  randomReferral() {
    return faker.helpers.arrayElement([() => this.randomDtrReferral(), () => this.randomCas1Referral(), () => this.randomCas3Referral()])()
  }

  buildReferralHistoryList(count: number) {
    return Array.from({ length: count }, () => this.randomReferral().build())
  }
}

const shortAddress = () => `${faker.location.street()}, ${faker.location.zipCode()}`

export default ReferralFactory.define(() => {
  return {
    id: faker.string.uuid(),
    type: 'CAS1' as const,
    status: 'ACCEPTED' as const,
    date: faker.date.past().toISOString(),
    referredBy: staffDetailsFactory.build(),
  }
})
