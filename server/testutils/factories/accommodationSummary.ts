import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'
import { AccommodationSummaryDto } from '@sas/api'
import addressFactory from './accommodationAddressDetails'
import crn from '../crn'

class AccommodationSummaryFactory extends Factory<AccommodationSummaryDto> {
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
}

const statuses: Readonly<AccommodationSummaryDto['status']['code'][]> = [
  'B',
  'M',
  'MA',
  'P',
  'PR',
  'PR1',
  'RJ',
  'RT',
  'S',
]
const types: Readonly<AccommodationSummaryDto['type']['code'][]> = [
  'A02',
  'A16',
  'A10',
  'A11',
  'A17',
  'A07B',
  'A07A',
  'A14',
  'A13',
  'A08A',
  'A08C',
  'A08',
  'A01A',
  'A15',
  'A12',
  'A01C',
  'A01D',
  'A04',
  'A03',
]

export default AccommodationSummaryFactory.define((): AccommodationSummaryDto => {
  return {
    crn: crn(),
    startDate: faker.date.past().toISOString().substring(0, 10),
    endDate: faker.date.future().toISOString().substring(0, 10),
    address: addressFactory.build(),
    status: {
      code: faker.helpers.arrayElement(statuses),
      description: faker.word.words(),
    },
    type: {
      code: faker.helpers.arrayElement(types),
      description: faker.word.words(),
    },
  }
})
