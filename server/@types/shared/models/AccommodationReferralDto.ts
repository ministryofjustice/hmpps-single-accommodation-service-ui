/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

import { AssignedToDto } from './AssignedToDto'

/* eslint-disable */
import type { StaffDetailsDto } from './StaffDetailsDto'
export type AccommodationReferralDto = {
  id: string
  type: 'CAS1' | 'CAS2' | 'CAS2v2' | 'CAS3' | 'DTR'
  status: 'ACCEPTED' | 'REJECTED' | 'PENDING' | 'WITHDRAWN'
  date: string
  referralRejectionReason?: string | null
  referralRejectionReasonDetail?: string | null
  localAuthorityArea?: string | null
  pdu?: string | null
  referredBy?: StaffDetailsDto | null
  placementAddress?: string | null
  placementStatus?: string | null
}
