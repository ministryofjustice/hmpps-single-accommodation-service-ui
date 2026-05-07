import { CaseDto as Case } from '@sas/api'
import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'
import crn from '../crn'
import prisonNumber from '../prisonNumber'
import tier from '../tier'
import riskLevel from '../riskLevel'
import pncReference from '../pncReference'
import assignedUserFactory from './assignedUser'
import accommodationFactory from './accommodation'

class CaseFactory extends Factory<Case> {
  confirmed() {
    const currentEndDate = faker.date.soon({ days: 60 }).toISOString().substring(0, 10)
    return this.params({
      currentAccommodation: faker.helpers.arrayElement([
        accommodationFactory.current(currentEndDate).cas().build(),
        accommodationFactory.current(currentEndDate).privateAddress().build(),
        accommodationFactory.current(currentEndDate).prison().build(),
      ]),
      nextAccommodation: faker.helpers.arrayElement([
        accommodationFactory.next(currentEndDate).privateAddress().build(),
        accommodationFactory.next(currentEndDate).cas().build(),
      ]),
      status: 'SETTLED',
    })
  }

  noFixedAbodeNext() {
    const currentEndDate = faker.date.soon({ days: 60 }).toISOString().substring(0, 10)
    return this.params({
      currentAccommodation: faker.helpers.arrayElement([
        accommodationFactory.current(currentEndDate).cas().build(),
        accommodationFactory.current(currentEndDate).privateAddress().build(),
        accommodationFactory.current(currentEndDate).prison().build(),
      ]),
      nextAccommodation: accommodationFactory.next(currentEndDate).noFixedAbode().build(),
      status: 'NO_FIXED_ABODE',
    })
  }

  noFixedAbodeCurrent() {
    return this.params({
      currentAccommodation: accommodationFactory.current().noFixedAbode().build(),
      nextAccommodation: undefined,
      status: 'RISK_OF_NO_FIXED_ABODE',
    })
  }
}

export default CaseFactory.define(() => {
  const currentAccommodation = accommodationFactory.current().build()
  const nextAccommodation =
    currentAccommodation.arrangementType === 'NO_FIXED_ABODE'
      ? undefined
      : accommodationFactory.next(currentAccommodation.endDate).build()

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
    status: faker.helpers.arrayElement(['RISK_OF_NO_FIXED_ABODE', 'NO_FIXED_ABODE', 'TRANSIENT', 'SETTLED']),
    actions: faker.helpers.maybe<string[]>(() => [faker.lorem.words(3), faker.lorem.words(3)]) ?? [],
  }
})
