import { CaseDto as Case } from '@sas/api'
import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'
import crn from '../crn'
import prisonNumber from '../prisonNumber'
import tier from '../tier'
import riskLevel from '../riskLevel'
import pncReference from '../pncReference'
import assignedUserFactory from './assignedUser'
import accommodationSummariesFactory from './accommodationSummaries'

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
    return this.params({
      accommodationSummaries: accommodationSummariesFactory.confirmed().build(),
    })
  }

  riskOfNfa() {
    return this.params({
      accommodationSummaries: accommodationSummariesFactory.riskOfNfa().build(),
    })
  }

  nfa() {
    return this.params({
      accommodationSummaries: accommodationSummariesFactory.nfa().build(),
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
    accommodationSummaries: accommodationSummariesFactory.build(),
  }
})
