import { Case } from '@sas/api'
import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'
import crn from '../crn'
import prisonNumber from '../prisonNumber'
import tier from '../tier'
import riskLevel from '../riskLevel'
import pncReference from '../pncReference'

export default Factory.define<Case>(() => ({
  name: faker.person.fullName(),
  crn: crn(),
  dateOfBirth: faker.date.birthdate().toISOString().substring(0, 10),
  prisonNumber: prisonNumber(),
  tier: tier(),
  riskLevel: riskLevel(),
  pncReference: pncReference(),
  // assignedTo?: AssignedTo;
  // currentAccommodation?: CurrentAccommodation;
  // nextAccommodation?: NextAccommodation;
}))
