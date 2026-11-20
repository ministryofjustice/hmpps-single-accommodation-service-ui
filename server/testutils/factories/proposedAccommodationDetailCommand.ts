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
  'TO_BE_DECIDED',
]

export default Factory.define<ProposedAccommodationDetailCommand>(({ params }) => {
  const verificationStatus = params.verificationStatus ?? faker.helpers.arrayElement(verificationStatuses)

  return {
    accommodationTypeCode: faker.helpers.arrayElement(accommodationTypes).code,
    verificationStatus,
    verificationReason: verificationStatus === 'NOT_CHECKED_YET' ? null : faker.lorem.sentence(),
    address: addressFactory.build(),
    nextAccommodationStatus: faker.helpers.arrayElement(nextAccommodationStatuses),
  }
})
