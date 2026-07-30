import { CaseDto as Case } from '@sas/api'
import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'
import crn from '../crn'
import prisonNumber from '../prisonNumber'
import tier from '../tier'
import riskLevel from '../riskLevel'
import pncReference from '../pncReference'
import assignedUserFactory from './assignedUser'
import actionFactory from './action'

class CaseFactory extends Factory<Case> {
  limitedAccess() {
    return this.params({
      name: null,
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
      actions: [],
      userAccess: 'LIMITED',
      limitedAccess: null,
    })
  }

  unknownAccess() {
    return this.limitedAccess().params({
      userAccess: 'UNKNOWN',
    })
  }
}

export default CaseFactory.define(() => {
  const forename = faker.person.firstName()
  const surname = faker.person.lastName()

  return {
    name: `${forename} ${surname}`,
    forename,
    middleNames: null as string,
    surname,
    crn: crn(),
    dateOfBirth: faker.date.birthdate().toISOString().substring(0, 10),
    prisonNumber: prisonNumber(),
    tierScore: tier(),
    riskLevel: riskLevel(),
    pncReference: pncReference(),
    assignedTo: assignedUserFactory.build(),
    actions: actionFactory.buildList(faker.number.int({ min: 0, max: 3 })),
    userAccess: 'FULL' as const,
    limitedAccess: false,
  }
})
