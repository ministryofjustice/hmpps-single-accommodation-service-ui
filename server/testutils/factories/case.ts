import { CurrentAccommodationDto, NextAccommodationDto } from '@sas/api'
import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'
import crn from '../crn'
import prisonNumber from '../prisonNumber'
import tier from '../tier'
import riskLevel from '../riskLevel'
import pncReference from '../pncReference'
import assignedUserFactory from './assignedUser'
import accommodationFactory from './accommodation'
import { CaseSummary } from '../../data/casesClient'

export default Factory.define<CaseSummary>(() => ({
  name: faker.person.fullName(),
  crn: crn(),
  dateOfBirth: faker.date.birthdate().toISOString().substring(0, 10),
  prisonNumber: prisonNumber(),
  tier: tier(),
  riskLevel: riskLevel(),
  pncReference: pncReference(),
  assignedTo: assignedUserFactory.build(),
  currentAccommodation: accommodationFactory.build() as CurrentAccommodationDto,
  nextAccommodation: accommodationFactory.build() as NextAccommodationDto,
}))
