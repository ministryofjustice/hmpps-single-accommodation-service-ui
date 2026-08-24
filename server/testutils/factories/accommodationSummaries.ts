import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'
import { AccommodationSummariesDto } from '@sas/api'
import accommodationSummaryFactory from './accommodationSummary'

class AccommodationSummariesFactory extends Factory<AccommodationSummariesDto> {
  confirmed() {
    const currentStartDate = faker.date.past().toISOString().substring(0, 10)
    const currentEndDate = faker.date.soon({ days: 60 }).toISOString().substring(0, 10)
    return this.params({
      caseAccommodationStatus: faker.helpers.arrayElement(['SETTLED', 'TRANSIENT'] as const),
      caseAccommodationStatusDate: currentStartDate,
      currentAccommodation: accommodationSummaryFactory.current(currentEndDate, currentStartDate).build(),
      nextAccommodation: accommodationSummaryFactory.next(currentEndDate).build(),
    })
  }

  confirmedUpcoming() {
    const currentEndDate = faker.date.soon({ days: 60 }).toISOString().substring(0, 10)
    return this.params({
      caseAccommodationStatus: faker.helpers.arrayElement(['SETTLED', 'TRANSIENT'] as const),
      caseAccommodationStatusDate: currentEndDate,
      currentAccommodation: accommodationSummaryFactory.current(currentEndDate).build(),
      nextAccommodation: accommodationSummaryFactory.next(currentEndDate).build(),
    })
  }

  riskOfNfa() {
    const currentEndDate = faker.date.soon({ days: 60 }).toISOString().substring(0, 10)
    return this.params({
      caseAccommodationStatus: 'RISK_OF_NO_FIXED_ABODE',
      caseAccommodationStatusDate: currentEndDate,
      currentAccommodation: accommodationSummaryFactory.current(currentEndDate).build(),
      nextAccommodation: null,
    })
  }

  nfa() {
    return this.params({
      caseAccommodationStatus: 'NO_FIXED_ABODE',
      caseAccommodationStatusDate: null,
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

  if (caseAccommodationStatus === 'NO_FIXED_ABODE') {
    return {
      caseAccommodationStatus,
      caseAccommodationStatusDate: null,
      currentAccommodation: null,
      nextAccommodation: null,
    }
  }

  if (caseAccommodationStatus === 'RISK_OF_NO_FIXED_ABODE') {
    const currentEndDate = faker.date.soon({ days: 60 }).toISOString().substring(0, 10)
    return {
      caseAccommodationStatus,
      caseAccommodationStatusDate: currentEndDate,
      currentAccommodation: accommodationSummaryFactory.current(currentEndDate).build(),
      nextAccommodation: null,
    }
  }

  const currentStartDate = faker.date.past().toISOString().substring(0, 10)
  const nextStartDate = faker.helpers.maybe(() => faker.date.soon({ days: 60 }).toISOString().substring(0, 10))

  return {
    caseAccommodationStatus,
    caseAccommodationStatusDate: currentStartDate,
    currentAccommodation: accommodationSummaryFactory.build({ startDate: currentStartDate, endDate: nextStartDate }),
    nextAccommodation: nextStartDate ? accommodationSummaryFactory.next(nextStartDate).build() : null,
  }
})
