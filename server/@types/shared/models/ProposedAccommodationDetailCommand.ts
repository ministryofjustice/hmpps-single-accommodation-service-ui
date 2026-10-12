/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AccommodationAddressDetails } from './AccommodationAddressDetails'
export type ProposedAccommodationDetailCommand = {
  accommodationTypeCode?: string | null
  verificationStatus: 'NOT_CHECKED_YET' | 'FAILED' | 'PASSED'
  nextAccommodationStatus: 'YES' | 'NO' | 'TO_BE_DECIDED'
  address: AccommodationAddressDetails
}
