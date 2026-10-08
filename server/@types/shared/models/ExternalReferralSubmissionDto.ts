/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

export type ExternalReferralSubmissionDto = {
  id: string
  referenceNumber?: string | null
  submissionDate: string
  createdBy: string
  createdByUsername: string
  createdAt: string
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
