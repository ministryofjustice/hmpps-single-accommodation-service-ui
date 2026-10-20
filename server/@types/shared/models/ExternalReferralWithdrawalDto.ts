/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

export type ExternalReferralWithdrawalDto = {
  withdrawalReason:
    | 'PLACEMENT_COMPLETE'
    | 'ANOTHER_ACCOMMODATION_FOUND'
    | 'NO_RESPONSE_FROM_ORGANISATION'
    | 'PERSON_CANNOT_BE_CONTACTED_OR_DISENGAGED'
    | 'PERSON_NO_LONGER_CONSENTS'
    | 'PERSON_NOT_SUITABLE'
    | 'NO_CAPACITY'
    | 'ANOTHER_REASON'
  otherReason?: string | null
  withdrawalNote?: string | null
}
