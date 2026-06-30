import { Factory } from 'fishery'
import { ProposedAccommodationArrivalCommand } from '@sas/api'
import { faker } from '@faker-js/faker'

export default Factory.define<ProposedAccommodationArrivalCommand>(() => ({
  arrivalDate: faker.date.recent().toISOString().split('T')[0],
}))
