/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { StaffDetailsDto } from './StaffDetailsDto'
export type AccommodationReferralDto = {
  id: string
  type: 'CAS1' | 'CAS2' | 'CAS3' | 'DTR' | 'CRS' | 'PA'
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
    | 'MORE_INFORMATION_REQUESTED'
    | 'PLACE_OFFERED'
    | 'AWAITING_ARRIVAL'
    | 'AWAITING_DECISION'
    | 'ON_WAITING_LIST'
    | 'OFFER_DECLINED_OR_WITHDRAWN'
  assessmentStatus?: string | null
  requestForPlacementStatus?: string | null
  date: string
  applicationLastUpdatedDate?: string | null
  referralRejectionReason?: string | null
  referralRejectionReasonDetail?: string | null
  localAuthorityArea?: string | null
  pdu?: string | null
  referredBy?: StaffDetailsDto | null
  placementAddress?: string | null
  placementStatus?: string | null
  uiUrl?: string | null
  withdrawalReason?: string | null
}
