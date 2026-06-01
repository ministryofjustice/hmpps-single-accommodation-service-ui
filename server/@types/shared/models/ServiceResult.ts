/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

export type ServiceResult = {
  serviceStatus:
    | 'NOT_ELIGIBLE'
    | 'UPCOMING'
    | 'NOT_STARTED'
    | 'NOT_SUBMITTED'
    | 'INFO_REQUESTED'
    | 'COMPLETED'
    | 'REJECTED'
    | 'WITHDRAWN'
    | 'SUBMITTED'
    | 'PLACEMENT_BOOKED'
    | 'CONFIRMED'
    | 'NOT_ARRIVED'
    | 'PLACEMENT_CANCELLED'
    | 'PLACEMENT_REQUEST_NOT_STARTED'
    | 'PLACEMENT_REQUEST_WITHDRAWN'
    | 'PLACEMENT_REQUEST_SUBMITTED'
    | 'PLACEMENT_REQUEST_REJECTED'
    | 'APPLICATION_REJECTED'
    | 'ARRIVED'
    | 'BEDSPACE_OFFERED'
    | 'BOOKING_CONFIRMED'
    | 'BOOKING_CANCELLED'
    | 'ACCEPTED'
    | 'NOT_ACCEPTED'
  action?: string | null
  link?: string | null
  failureReasons: Array<
    | 'S_TIER'
    | 'MALE_NOT_HIGH_RISK_TIER'
    | 'NON_MALE_NOT_HIGH_RISK_TIER'
    | 'SEX_DATA_NOT_AVAILABLE'
    | 'INVALID_CURRENT_ACCOMMODATION_TYPE'
    | 'CRS_EXPIRED'
    | 'CRS_NOT_SUBMITTED'
    | 'HAS_NEXT_ACCOMMODATION'
    | 'DTR_REFERRAL_EXPIRED'
    | 'INVALID_APPLICATION_STATE'
    | 'SUITABLE_CAS1_APPLICATION'
    | 'SUITABLE_CAS3_APPLICATION'
  >
}
