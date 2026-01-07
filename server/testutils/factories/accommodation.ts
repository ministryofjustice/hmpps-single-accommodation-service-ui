import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'
import { AccommodationDetail } from '@sas/api'
import addressFactory from './address'

export const types: Readonly<AccommodationDetail['type'][]> = [
  'CAS1',
  'CAS2',
  'CAS2V2',
  'CAS3',
  'PRISON',
  'PRIVATE',
  'NO_FIXED_ABODE',
]
const subTypes: Readonly<AccommodationDetail['subType'][]> = ['OWNED', 'RENTED', 'LODGING']
const offenderReleaseTypes: Readonly<AccommodationDetail['offenderReleaseType'][]> = ['BAIL', 'LICENCE', 'REMAND']

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
      type: 'PRISON',
      subType: undefined,
      name: `HMP ${faker.location.city()}`,
      isSettled: undefined,
      offenderReleaseType: faker.helpers.maybe(() => faker.helpers.arrayElement(offenderReleaseTypes)),
    })
  }

  privateAddress() {
    return this.params({
      type: 'PRIVATE',
      subType: faker.helpers.arrayElement(subTypes),
      name: faker.helpers.arrayElement(['Relatives', 'Family', 'Friends']),
      isSettled: faker.datatype.boolean(),
      offenderReleaseType: undefined,
    })
  }

  cas(casType?: 'CAS1' | 'CAS2' | 'CAS2V2' | 'CAS3') {
    return this.params({
      type: casType || faker.helpers.arrayElement(['CAS1', 'CAS2', 'CAS2V2', 'CAS3']),
      subType: undefined,
      name: faker.location.city(),
      isSettled: false,
      offenderReleaseType: undefined,
    })
  }

  noFixedAbode() {
    return this.params({
      type: 'NO_FIXED_ABODE',
      subType: undefined,
      name: undefined,
      isSettled: undefined,
      offenderReleaseType: undefined,
      address: undefined,
    })
  }
}

export default AccommodationFactory.define(() => {
  const type = faker.helpers.arrayElement(types)

  return {
    type,
    subType: type === 'PRIVATE' ? faker.helpers.arrayElement(subTypes) : undefined,
    name: type === 'PRISON' ? `HMP ${faker.location.city()}` : faker.word.words(2),
    isSettled: type === 'PRIVATE' ? faker.datatype.boolean() : undefined,
    offenderReleaseType: type === 'PRISON' ? faker.helpers.arrayElement(offenderReleaseTypes) : undefined,
    startDate: faker.date.past().toISOString().substring(0, 10),
    endDate: faker.date.future().toISOString().substring(0, 10),
    address: addressFactory.build(),
  }
})
