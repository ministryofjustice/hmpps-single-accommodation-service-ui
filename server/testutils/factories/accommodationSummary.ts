import { Factory } from 'fishery'
import { AccommodationStatusDto, AccommodationSummaryDto, AccommodationTypeDto } from '@sas/api'
import { faker } from '@faker-js/faker'
import addressFactory from './accommodationAddressDetails'
import crnFactory from '../crn'

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

  lastStartDate: Date

  sequential() {
    const endDate = this.lastStartDate
    const startDate = faker.date.past({ refDate: endDate })
    this.lastStartDate = startDate

    return this.params({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate?.toISOString().split('T')[0],
      status: endDate ? { code: 'P', description: 'Previous' } : { code: 'M', description: 'Main' },
    })
  }

  buildListSequential(count: number) {
    this.lastStartDate = faker.datatype.boolean() ? faker.date.soon({ days: 60 }) : undefined
    return Array.from({ length: count }, () => this.sequential().build())
  }
}

const statuses: Readonly<AccommodationStatusDto['code'][]> = ['B', 'M', 'MA', 'P', 'PR', 'PR1', 'RJ', 'RT', 'S']

const types: Readonly<AccommodationTypeDto['code'][]> = [
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
    crn: crnFactory(),
    startDate: faker.date.past().toISOString().substring(0, 10),
    endDate: undefined,
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
