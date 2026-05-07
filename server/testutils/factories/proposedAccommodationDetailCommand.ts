import { Factory } from 'fishery'
import { ProposedAccommodationDetailCommand } from '@sas/api'
import { faker } from '@faker-js/faker/locale/en_GB'
import addressFactory from './accommodationAddressDetails'
import { accommodationTypes } from './proposedAccommodation'

const verificationStatuses: Readonly<ProposedAccommodationDetailCommand['verificationStatus'][]> = [
  'NOT_CHECKED_YET',
  'PASSED',
  'FAILED',
]
const nextAccommodationStatuses: Readonly<ProposedAccommodationDetailCommand['nextAccommodationStatus'][]> = [
  'YES',
  'NO',
  'TO_BE_DECIDED',
]

export default Factory.define<ProposedAccommodationDetailCommand>(() => ({
  accommodationTypeCode: faker.helpers.arrayElement(accommodationTypes).code,
  verificationStatus: faker.helpers.arrayElement(verificationStatuses),
  address: addressFactory.build(),
  nextAccommodationStatus: faker.helpers.arrayElement(nextAccommodationStatuses),
}))
