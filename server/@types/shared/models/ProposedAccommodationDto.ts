/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AccommodationAddressDetails } from './AccommodationAddressDetails'
import type { AccommodationTypeDto } from './AccommodationTypeDto'
export type ProposedAccommodationDto = {
  id: string
  crn: string
  accommodationType?: AccommodationTypeDto | null
  verificationStatus?: 'NOT_CHECKED_YET' | 'FAILED' | 'PASSED'
  nextAccommodationStatus?: 'YES' | 'NO' | 'TO_BE_DECIDED'
  address: AccommodationAddressDetails
  createdBy: string
  createdAt: string
}
