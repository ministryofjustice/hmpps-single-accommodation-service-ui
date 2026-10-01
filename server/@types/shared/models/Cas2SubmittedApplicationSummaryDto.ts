/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

export type Cas2SubmittedApplicationSummaryDto = {
  latestAssessmentStatus?:
    | 'MORE_INFO_REQUESTED'
    | 'AWAITING_DECISION'
    | 'ON_WAITING_LIST'
    | 'PLACE_OFFERED'
    | 'OFFER_ACCEPTED'
    | 'OFFER_DECLINED'
    | 'WITHDRAWN'
    | 'CANCELLED'
    | 'AWAITING_ARRIVAL'
    | 'UNKNOWN'
  offerDeclinedReason?: string | null
  cancelledReason?: string | null
  submittedAt: string
}
