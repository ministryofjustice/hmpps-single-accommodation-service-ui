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
    return this.params({
      currentAccommodation: faker.helpers.arrayElement([
        accommodationFactory.current().cas().build(),
        accommodationFactory.current().privateAddress().build(),
        accommodationFactory.current().prison().build(),
      ]),
      nextAccommodation: faker.helpers.arrayElement([
        accommodationFactory.next().privateAddress().build(),
        accommodationFactory.next().cas().build(),
      ]),
    })
  }

  noFixedAbodeNext() {
    return this.params({
      currentAccommodation: faker.helpers.arrayElement([
        accommodationFactory.current().cas().build(),
        accommodationFactory.current().privateAddress().build(),
        accommodationFactory.current().prison().build(),
      ]),
      nextAccommodation: accommodationFactory.next().noFixedAbode().build(),
    })
  }

  noFixedAbodeCurrent() {
    return this.params({
      currentAccommodation: accommodationFactory.current().noFixedAbode().build(),
      nextAccommodation: undefined,
    })
  }
}

export default CaseFactory.define(() => {
  const currentAccommodation = accommodationFactory.current().build()
  const nextAccommodation = accommodationFactory.next(currentAccommodation.endDate).build()

  return {
    name: faker.person.fullName(),
    crn: crn(),
    dateOfBirth: faker.date.birthdate().toISOString().substring(0, 10),
    prisonNumber: prisonNumber(),
    tier: tier(),
    riskLevel: riskLevel(),
    pncReference: pncReference(),
    assignedTo: assignedUserFactory.build(),
    currentAccommodation,
    nextAccommodation,
  }
})
