/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
// FIXME: This has been edited manually to override the current API type:
//  Added properties: `name`, `offenderReleaseType`
//  Made optional: `settledType`
import type { AccommodationAddressDetails } from './AccommodationAddressDetails'
export type AccommodationDetail = {
  id: string
  arrangementType: 'PRISON' | 'CAS1' | 'CAS2' | 'CAS2V2' | 'CAS3' | 'PRIVATE' | 'NO_FIXED_ABODE'
  arrangementSubType?:
    | 'FRIENDS_OR_FAMILY'
    | 'SOCIAL_RENTED'
    | 'PRIVATE_RENTED_WHOLE_PROPERTY'
    | 'PRIVATE_RENTED_ROOM'
    | 'OWNED'
    | 'OTHER'
  arrangementSubTypeDescription?: string
  name?: string
  offenderReleaseType?: 'REMAND' | 'LICENCE' | 'BAIL'
  settledType?: 'SETTLED' | 'TRANSIENT'
  status?: 'NOT_CHECKED_YET' | 'PASSED' | 'FAILED'
  address: AccommodationAddressDetails
  startDate?: string
  endDate?: string
}
