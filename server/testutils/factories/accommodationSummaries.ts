import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'
import { AccommodationSummariesDto } from '@sas/api'
import accommodationSummaryFactory from './accommodationSummary'

class AccommodationSummariesFactory extends Factory<AccommodationSummariesDto> {
  confirmed() {
    const currentEndDate = faker.date.soon({ days: 60 }).toISOString().substring(0, 10)
    return this.params({
      caseAccommodationStatus: faker.helpers.arrayElement(['SETTLED', 'TRANSIENT']),
      currentAccommodation: accommodationSummaryFactory.current(currentEndDate).build(),
      nextAccommodation: accommodationSummaryFactory.next(currentEndDate).build(),
    })
  }

  riskOfNfa() {
    const currentEndDate = faker.date.soon({ days: 60 }).toISOString().substring(0, 10)
    return this.params({
      caseAccommodationStatus: 'RISK_OF_NO_FIXED_ABODE',
      currentAccommodation: accommodationSummaryFactory.current(currentEndDate).build(),
      nextAccommodation: null,
    })
  }

  nfa() {
    return this.params({
      caseAccommodationStatus: 'NO_FIXED_ABODE',
      currentAccommodation: null,
      nextAccommodation: null,
    })
  }
}

export default AccommodationSummariesFactory.define((): AccommodationSummariesDto => {
  const caseAccommodationStatus = faker.helpers.arrayElement([
    'RISK_OF_NO_FIXED_ABODE',
    'NO_FIXED_ABODE',
    'TRANSIENT',
    'SETTLED',
  ])
  const currentAccommodation =
    caseAccommodationStatus === 'NO_FIXED_ABODE' ? null : accommodationSummaryFactory.current().build()
  const nextAccommodation =
    caseAccommodationStatus === 'RISK_OF_NO_FIXED_ABODE' ? null : accommodationSummaryFactory.next().build()

  return {
    caseAccommodationStatus,
    currentAccommodation,
    nextAccommodation,
  }
})
