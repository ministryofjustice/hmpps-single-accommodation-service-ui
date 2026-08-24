/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Cas1StaffDto } from './Cas1StaffDto'
export type Cas1RequestForPlacementSummaryDto = {
  status?:
    | 'REQUEST_UNSUBMITTED'
    | 'REQUEST_REJECTED'
    | 'REQUEST_SUBMITTED'
    | 'AWAITING_MATCH'
    | 'REQUEST_WITHDRAWN'
    | 'PLACEMENT_BOOKED'
  decision?: 'ACCEPTED' | 'REJECTED' | 'WITHDRAW' | 'WITHDRAWN_BY_PP'
  rejectionReason?: string | null
  submittedBy?: Cas1StaffDto | null
  submittedAt?: string | null
  withdrawalReason?:
    | 'DUPLICATE_PLACEMENT_REQUEST'
    | 'ALTERNATIVE_PROVISION_IDENTIFIED'
    | 'CHANGE_IN_CIRCUMSTANCES'
    | 'CHANGE_IN_RELEASE_DECISION'
    | 'NO_CAPACITY_DUE_TO_LOST_BED'
    | 'NO_CAPACITY_DUE_TO_PLACEMENT_PRIORITISATION'
    | 'NO_CAPACITY'
    | 'ERROR_IN_PLACEMENT_REQUEST'
    | 'WITHDRAWN_BY_PP'
    | 'RELATED_APPLICATION_WITHDRAWN'
    | 'RELATED_PLACEMENT_REQUEST_WITHDRAWN'
    | 'RELATED_PLACEMENT_APPLICATION_WITHDRAWN'
  withdrawalDate?: string | null
  expectedArrivalDate?: string | null
  durationDays?: number | null
}
