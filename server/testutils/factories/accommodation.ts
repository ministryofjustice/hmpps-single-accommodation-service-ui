import { Factory } from 'fishery'
import { AccommodationDto } from '@sas/ui'
import { faker } from '@faker-js/faker'
import addressFactory from './address'

export const types: Readonly<AccommodationDto['type'][]> = [
  'cas1',
  'cas2',
  'cas2v2',
  'cas3',
  'prison',
  'private',
  'nfa',
]
const subtypes: Readonly<AccommodationDto['subtype'][]> = ['owned', 'rented', 'lodging']
const qualifiers: Readonly<AccommodationDto['qualifier'][]> = ['bail', 'licence', 'remand']

class AccommodationFactory extends Factory<AccommodationDto> {
  current(date?: string) {
    return this.params({
      startDate: undefined,
      endDate: date || faker.date.future().toISOString().substring(0, 10),
    })
  }

  next(date?: string) {
    return this.params({
      startDate: date || faker.date.future().toISOString().substring(0, 10),
      endDate: undefined,
    })
  }

  prison() {
    return this.params({
      type: 'prison',
      subtype: undefined,
      name: `HMP ${faker.word.words(2)}`,
      isSettled: undefined,
      qualifier: faker.helpers.maybe(() => faker.helpers.arrayElement(qualifiers)),
    })
  }

  privateAddress() {
    return this.params({
      type: 'private',
      subtype: faker.helpers.arrayElement(subtypes),
      name: faker.word.words(2),
      isSettled: faker.datatype.boolean(),
      qualifier: undefined,
    })
  }

  cas(casType?: 'cas1' | 'cas2' | 'cas2v2' | 'cas3') {
    return this.params({
      type: casType || faker.helpers.arrayElement(['cas1', 'cas2', 'cas2v2', 'cas3']),
      subtype: undefined,
      name: faker.location.city(),
      isSettled: false,
      qualifier: undefined,
    })
  }

  noFixedAbode() {
    return this.params({
      type: 'nfa',
      subtype: undefined,
      name: undefined,
      isSettled: undefined,
      qualifier: undefined,
      address: undefined,
    })
  }
}

export default AccommodationFactory.define(() => {
  const type = faker.helpers.arrayElement(types)

  return {
    id: faker.string.uuid(),
    type,
    subtype: type === 'private' ? faker.helpers.arrayElement(subtypes) : undefined,
    name: `${type === 'prison' ? 'HMP ' : ''}${faker.word.words(2)}`,
    isSettled: type === 'private' ? faker.datatype.boolean() : undefined,
    qualifier: type === 'prison' ? faker.helpers.arrayElement(qualifiers) : undefined,
    startDate: faker.date.past().toISOString().substring(0, 10),
    endDate: faker.date.future().toISOString().substring(0, 10),
    address: addressFactory.build(),
  }
})
