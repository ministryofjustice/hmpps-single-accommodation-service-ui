import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'
import { AccommodationDetail } from '@sas/api'
import addressFactory from './accommodationAddressDetails'

export const types: Readonly<AccommodationDetail['arrangementType'][]> = [
  'CAS1',
  'CAS2',
  'CAS2V2',
  'CAS3',
  'PRISON',
  'PRIVATE',
  'NO_FIXED_ABODE',
]
const subTypes: Readonly<AccommodationDetail['arrangementSubType'][]> = [
  'FRIENDS_OR_FAMILY',
  'SOCIAL_RENTED',
  'PRIVATE_RENTED_WHOLE_PROPERTY',
  'PRIVATE_RENTED_ROOM',
  'OWNED',
  'OTHER',
]
const offenderReleaseTypes: Readonly<AccommodationDetail['offenderReleaseType'][]> = ['BAIL', 'LICENCE', 'REMAND']
const settledTypes: Readonly<AccommodationDetail['settledType'][]> = ['SETTLED', 'TRANSIENT']
const statuses: Readonly<AccommodationDetail['status'][]> = [
  'NOT_CHECKED_YET',
  'CHECKS_PASSED',
  'CHECKS_FAILED',
  'CONFIRMED',
]

class AccommodationFactory extends Factory<AccommodationDetail> {
  current(endDate?: string, startDate?: string) {
    return this.params({
      startDate: startDate || faker.date.past().toISOString().substring(0, 10),
      endDate: endDate || faker.date.soon({ days: 60 }).toISOString().substring(0, 10),
    })
  }

  next(startDate?: string) {
    return this.params({
      startDate: startDate || faker.date.soon({ days: 60 }).toISOString().substring(0, 10),
      endDate: undefined,
    })
  }

  prison() {
    return this.params({
      arrangementType: 'PRISON',
      arrangementSubType: undefined,
      name: `HMP ${faker.location.city()}`,
      settledType: undefined,
      offenderReleaseType: faker.helpers.maybe(() => faker.helpers.arrayElement(offenderReleaseTypes)),
    })
  }

  privateAddress() {
    return this.params({
      arrangementType: 'PRIVATE',
      arrangementSubType: faker.helpers.arrayElement(subTypes),
      name: faker.helpers.arrayElement(['Relatives', 'Family', 'Friends']),
      settledType: faker.helpers.arrayElement(settledTypes),
      offenderReleaseType: undefined,
    })
  }

  cas(casType?: 'CAS1' | 'CAS2' | 'CAS2V2' | 'CAS3') {
    return this.params({
      arrangementType: casType || faker.helpers.arrayElement(['CAS1', 'CAS2', 'CAS2V2', 'CAS3']),
      arrangementSubType: undefined,
      name: faker.location.city(),
      settledType: undefined,
      offenderReleaseType: undefined,
    })
  }

  noFixedAbode() {
    return this.params({
      arrangementType: 'NO_FIXED_ABODE',
      arrangementSubType: undefined,
      name: undefined,
      settledType: undefined,
      offenderReleaseType: undefined,
      address: undefined,
    })
  }

  proposed() {
    return this.privateAddress()
  }
}

export default AccommodationFactory.define(() => {
  const arrangementType = faker.helpers.arrayElement(types)

  return {
    id: faker.string.uuid(),
    arrangementType,
    arrangementSubType: arrangementType === 'PRIVATE' ? faker.helpers.arrayElement(subTypes) : undefined,
    name: arrangementType === 'PRISON' ? `HMP ${faker.location.city()}` : faker.word.words(2),
    offenderReleaseType: arrangementType === 'PRISON' ? faker.helpers.arrayElement(offenderReleaseTypes) : undefined,
    settledType: arrangementType === 'PRIVATE' ? faker.helpers.arrayElement(settledTypes) : undefined,
    startDate: faker.date.past().toISOString().substring(0, 10),
    endDate: faker.date.future().toISOString().substring(0, 10),
    address: addressFactory.build(),
    createdAt: faker.date.recent({ days: 10 }).toISOString(),
  }
})
