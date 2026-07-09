/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { StaffDetailsDto } from './StaffDetailsDto'
export type AccommodationReferralDto = {
  id: string
  type: 'CAS1' | 'CAS3' | 'DTR'
  status:
    | 'ACCEPTED'
    | 'REJECTED'
    | 'PENDING'
    | 'WITHDRAWN'
    | 'EXPIRED'
    | 'NOT_ARRIVED'
    | 'DEPARTED'
    | 'CANCELLED'
    | 'REQUEST_REJECTED'
    | 'REQUEST_WITHDRAWN'
    | 'ARCHIVED'
  assessmentStatus?: string | null
  requestForPlacementStatus?: string | null
  date: string
  referralRejectionReason?: string | null
  referralRejectionReasonDetail?: string | null
  localAuthorityArea?: string | null
  pdu?: string | null
  referredBy?: StaffDetailsDto | null
  placementAddress?: string | null
  placementStatus?: string | null
  uiUrl?: string | null
}
