import { Factory } from 'fishery'
import { faker } from '@faker-js/faker/locale/en_GB'
import { AccommodationReferralDto as Referral } from '@sas/api'

const cas1Statuses = [
  'CANCELLED',
  'DEPARTED',
  'NOT_ARRIVED',
  'REQUEST_WITHDRAW',
  'REQUEST_REJECTED',
  'REJECTED',
  'WITHDRAW',
  'EXPIRED',
] as const

const cas3Statuses = ['REJECTED', 'DEPARTED', 'CANCELLED', 'ARCHIVED'] as const

class ReferralFactory extends Factory<Referral> {
  cas1Application() {
    return this.params({
      id: faker.string.uuid(),
      applicationId: faker.string.uuid(),
      type: 'CAS1',
      createdAt: faker.date.past().toISOString(),
      referralRejectionReason: undefined,
      localAuthorityArea: null,
      pdu: null,
      referredBy: faker.person.fullName(),
      placementAddress: null,
      placementStatus: null,
      status: faker.helpers.arrayElement(cas1Statuses),
    })
  }

  cas1ApplicationExpired() {
    return this.cas1Application().params({ status: 'EXPIRED' })
  }

  cas1ApplicationWithdrawn() {
    return this.cas1Application().params({ status: 'WITHDRAW' })
  }

  cas1ApplicationRejected(reason = 'Some rejection reason') {
    return this.cas1Application().params({ status: 'REJECTED', referralRejectionReason: reason })
  }

  cas1PlacementRequestRejected() {
    return this.cas1Application().params({ status: 'REQUEST_REJECTED' })
  }

  cas1PlacementRequestWithdrawn(reason = 'Some request withdrawal reason') {
    return this.cas1Application().params({ status: 'REQUEST_WITHDRAW', referralRejectionReason: reason })
  }

  cas1PlacementNotArrived() {
    return this.cas1Application().params({ status: 'NOT_ARRIVED', placementAddress: shortAddress() })
  }

  cas1PlacementDeparted() {
    return this.cas1Application().params({ status: 'DEPARTED', placementAddress: shortAddress() })
  }

  cas1PlacementCancelled() {
    return this.cas1Application().params({ status: 'CANCELLED', pdu: faker.location.city() })
  }

  cas3Referral() {
    return this.params({
      id: faker.string.uuid(),
      applicationId: faker.string.uuid(),
      type: 'CAS3',
      createdAt: faker.date.past().toISOString(),
      referralRejectionReason: undefined,
      localAuthorityArea: null,
      pdu: null,
      referredBy: faker.person.fullName(),
      placementAddress: null,
      placementStatus: null,
      status: faker.helpers.arrayElement(cas3Statuses),
    })
  }

  cas3ReferralRejected(
    reason = 'Local authority alternative suitable accommodation provided (includes Priority need)',
  ) {
    return this.cas3Referral().params({
      status: 'REJECTED',
      referralRejectionReason: reason,
      referralRejectionDetails: faker.lorem.words(40),
    })
  }

  cas3ReferralArchived() {
    return this.cas3Referral().params({ status: 'ARCHIVED' })
  }

  cas3BookingDeparted() {
    return this.cas3Referral().params({
      status: 'DEPARTED',
      pdu: faker.location.city(),
      placementAddress: shortAddress(),
    })
  }

  cas3BookingCancelled() {
    return this.cas3Referral().params({
      status: 'CANCELLED',
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
    return faker.helpers.arrayElement([() => this.randomCas1Referral(), () => this.randomCas3Referral()])()
  }

  buildReferralHistoryList(count: number) {
    return Array.from({ length: count }, () => this.randomReferral().build())
  }
}

const shortAddress = () => `${faker.location.street()}, ${faker.location.zipCode()}`

export default ReferralFactory.define(() => {
  return {
    id: faker.string.uuid(),
    applicationId: faker.string.uuid(),
    type: 'CAS1' as const,
    status: 'CANCELLED' as const,
    createdAt: faker.date.past().toISOString(),
    pdu: faker.location.city()
  }
})
