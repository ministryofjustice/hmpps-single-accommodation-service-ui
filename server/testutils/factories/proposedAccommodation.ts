import { AccommodationTypeDto, ProposedAccommodationDto } from '@sas/api'
import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'
import crn from '../crn'
import addressFactory from './accommodationAddressDetails'
import accommodationTypesJson from '../../../wiremock/fixtures/referenceData/accommodationTypes.json'

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

export const accommodationTypes: Readonly<AccommodationTypeDto[]> = accommodationTypesJson.map(type => ({
  code: type.code,
  description: type.name,
}))

export const accommodationTypesMap: Readonly<
  Record<AccommodationTypeDto['code'], AccommodationTypeDto['description']>
> = Object.fromEntries(accommodationTypes.map(type => [type.code, type.description]))

export default Factory.define<ProposedAccommodationDto>(() => {
  const verificationStatus = faker.helpers.arrayElement(verificationStatuses)
  const nextAccommodationStatus =
    verificationStatus === 'PASSED' ? faker.helpers.arrayElement(nextAccommodationStatuses) : undefined
  return {
    id: faker.string.uuid(),
    crn: crn(),
    accommodationType: faker.helpers.arrayElement(accommodationTypes),
    verificationStatus,
    nextAccommodationStatus,
    startDate: faker.date.past().toISOString().substring(0, 10),
    endDate: faker.date.future().toISOString().substring(0, 10),
    address: addressFactory.build(),
    createdAt: faker.date.recent({ days: 10 }).toISOString(),
    createdBy: faker.person.fullName(),
  }
})
