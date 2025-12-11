import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'
import crn from '../crn'
import prisonNumber from '../prisonNumber'
import tier from '../tier'
import riskLevel from '../riskLevel'
import pncReference from '../pncReference'
import assignedUserFactory from './assignedUser'
import accommodationFactory from './accommodation'
import { Case } from '../../data/casesClient'

export default Factory.define<Case>(() => ({
  name: faker.person.fullName(),
  crn: crn(),
  dateOfBirth: faker.date.birthdate().toISOString().substring(0, 10),
  prisonNumber: prisonNumber(),
  tier: tier(),
  riskLevel: riskLevel(),
  pncReference: pncReference(),
  assignedTo: assignedUserFactory.build(),
  currentAccommodation: accommodationFactory.build(),
  nextAccommodation: accommodationFactory.build(),
}))
