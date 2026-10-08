/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

export type ExternalReferralCommand = {
  submissionDate: string
  referenceNumber?: string | null
  status: 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'ARCHIVED'
  organisationName?: string | null
  website?: string | null
  submissionNote?: string | null
  email?: string | null
  phoneNumber?: string | null
  withdrawalReason?:
    | 'PLACEMENT_COMPLETE'
    | 'ACCEPTED_BY_ORGANISATION'
    | 'ACCEPTED_WITH_ACCOMMODATION_PLACEMENT'
    | 'PERSON_NOT_SUITABLE'
    | 'NO_CAPACITY'
    | 'ANOTHER_REASON'
  withdrawalNote?: string | null
  outcomeNote?: string | null
}
