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
  limitedAccess() {
    return this.params({
      forename: null,
      middleNames: null,
      surname: null,
      crn: crn(),
      dateOfBirth: null,
      prisonNumber: prisonNumber(),
      tierScore: null,
      riskLevel: null,
      pncReference: null,
      assignedTo: assignedUserFactory.build(),
      userAccess: 'LIMITED',
      limitedAccess: null,
    })
  }

  unknownAccess() {
    return this.limitedAccess().params({
      userAccess: 'UNKNOWN',
    })
  }

  settled() {
    const currentEndDate = faker.date.soon({ days: 60 }).toISOString().substring(0, 10)
    return this.params({
      status: 'SETTLED',
      currentAccommodation: accommodationSummaryFactory.current(currentEndDate).build(),
      nextAccommodation: accommodationSummaryFactory.next(currentEndDate).build(),
    })
  }

  riskOfNfa() {
    const currentEndDate = faker.date.soon({ days: 60 }).toISOString().substring(0, 10)
    return this.params({
      status: 'RISK_OF_NO_FIXED_ABODE',
      currentAccommodation: accommodationSummaryFactory.current(currentEndDate).build(),
      nextAccommodation: null,
    })
  }

  nfa() {
    return this.params({
      status: 'NO_FIXED_ABODE',
      currentAccommodation: null,
      nextAccommodation: null,
    })
  }
}

export default CaseFactory.define(() => {
  return {
    forename: faker.person.firstName(),
    middleNames: null as string,
    surname: faker.person.lastName(),
    crn: crn(),
    dateOfBirth: faker.date.birthdate().toISOString().substring(0, 10),
    prisonNumber: prisonNumber(),
    tierScore: tier(),
    riskLevel: riskLevel(),
    pncReference: pncReference(),
    assignedTo: assignedUserFactory.build(),
    userAccess: 'FULL' as const,
    limitedAccess: false,
  }
})
