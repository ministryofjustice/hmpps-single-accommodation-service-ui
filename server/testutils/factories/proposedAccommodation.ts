import { AccommodationTypeDto, ProposedAccommodationDto } from '@sas/api'
import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'
import crn from '../crn'
import addressFactory from './accommodationAddressDetails'

const verificationStatuses: Readonly<ProposedAccommodationDto['verificationStatus'][]> = [
  'NOT_CHECKED_YET',
  'PASSED',
  'FAILED',
]
const nextAccommodationStatuses: Readonly<ProposedAccommodationDto['nextAccommodationStatus'][]> = [
  'YES',
  'NO',
  'TO_BE_DECIDED',
]

export const accommodationTypes: Readonly<AccommodationTypeDto['code'][]> = [
  'A02',
  'A16',
  'A10',
  'A11',
  'A17',
  'A07B',
  'A07A',
  'A14',
  'A13',
  'A08A',
  'A08C',
  'A08',
  'A01A',
  'A15',
  'A12',
  'A01C',
  'A01D',
  'A04',
  'A03',
]

export default Factory.define<ProposedAccommodationDto>(() => {
  const verificationStatus = faker.helpers.arrayElement(verificationStatuses)
  const nextAccommodationStatus =
    verificationStatus === 'PASSED' ? faker.helpers.arrayElement(nextAccommodationStatuses) : undefined
  return {
    id: faker.string.uuid(),
    crn: crn(),
    accommodationType: {
      code: faker.helpers.arrayElement(accommodationTypes),
      description: faker.word.words(),
    },
    verificationStatus,
    nextAccommodationStatus,
    startDate: faker.date.past().toISOString().substring(0, 10),
    endDate: faker.date.future().toISOString().substring(0, 10),
    address: addressFactory.build(),
    createdAt: faker.date.recent({ days: 10 }).toISOString(),
    createdBy: faker.person.fullName(),
  }
})
