import { CaseDto as Case } from '@sas/api'
import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'
import crn from '../crn'
import prisonNumber from '../prisonNumber'
import tier from '../tier'
import riskLevel from '../riskLevel'
import pncReference from '../pncReference'
import assignedUserFactory from './assignedUser'
import accommodationSummaryFactory from './accommodationSummary'

class CaseFactory extends Factory<Case> {
  confirmed() {
    const currentEndDate = faker.date.soon({ days: 60 }).toISOString().substring(0, 10)
    return this.params({
      currentAccommodation: accommodationSummaryFactory.current(currentEndDate).build(),
      nextAccommodation: accommodationSummaryFactory.next(currentEndDate).build(),
      status: faker.helpers.arrayElement(['SETTLED', 'TRANSIENT']),
    })
  }

  riskOfNfa() {
    const currentEndDate = faker.date.soon({ days: 60 }).toISOString().substring(0, 10)
    return this.params({
      currentAccommodation: accommodationSummaryFactory.current(currentEndDate).build(),
      nextAccommodation: null,
      status: 'RISK_OF_NO_FIXED_ABODE',
    })
  }
}

export default CaseFactory.define(() => {
  const status = faker.helpers.arrayElement(['RISK_OF_NO_FIXED_ABODE', 'NO_FIXED_ABODE', 'TRANSIENT', 'SETTLED'])
  const currentAccommodation = status === 'NO_FIXED_ABODE' ? null : accommodationSummaryFactory.current().build()
  const nextAccommodation = status === 'RISK_OF_NO_FIXED_ABODE' ? null : accommodationSummaryFactory.next().build()

  return {
    name: faker.person.fullName(),
    crn: crn(),
    dateOfBirth: faker.date.birthdate().toISOString().substring(0, 10),
    prisonNumber: prisonNumber(),
    tierScore: tier(),
    riskLevel: riskLevel(),
    pncReference: pncReference(),
    assignedTo: assignedUserFactory.build(),
    currentAccommodation,
    nextAccommodation,
    status,
    actions: faker.helpers.maybe<string[]>(() => [faker.lorem.words(3), faker.lorem.words(3)]) ?? [],
  }
})
