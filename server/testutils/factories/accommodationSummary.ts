import { Factory } from 'fishery'
import { AccommodationStatusDto, AccommodationSummaryDto, AccommodationTypeDto } from '@sas/api'
import { faker } from '@faker-js/faker'
import addressFactory from './accommodationAddressDetails'
import crnFactory from '../crn'
import accommodationTypesJson from '../../../wiremock/fixtures/referenceData/accommodationTypes.json'

const accommodationStatusFactory = Factory.define<AccommodationTypeDto>(() =>
  faker.helpers.arrayElement([
    { code: 'M', description: 'Main' },
    { code: 'P', description: 'Previous' },
  ]),
)

const accommodationTypesFactory = Factory.define<AccommodationStatusDto>(() =>
  faker.helpers.arrayElement(accommodationTypesJson.map(type => ({ code: type.code, description: type.name }))),
)

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
    return Array.from({ length: count }, () => this.sequential().build())
  }
}

export default AccommodationSummaryFactory.define((): AccommodationSummaryDto => {
  return {
    crn: crnFactory(),
    startDate: faker.date.past().toISOString().substring(0, 10),
    endDate: undefined,
    address: addressFactory.build(),
    status: accommodationStatusFactory.build(),
    type: accommodationTypesFactory.build(),
  }
})
