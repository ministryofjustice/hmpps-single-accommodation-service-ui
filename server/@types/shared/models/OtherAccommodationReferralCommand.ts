/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

export type OtherAccommodationReferralCommand = {
  submissionDate: string
  referenceNumber?: string | null
  status: 'SUBMITTED' | 'ACCEPTED' | 'REJECTED'
  organisationName?: string | null
  website?: string | null
  submissionNote?: string | null
  email?: string | null
  phoneNumber?: string | null
  outcomeReason?:
    | 'ACCEPTED_BY_ORGANISATION'
    | 'ACCEPTED_WITH_ACCOMMODATION_PLACEMENT'
    | 'PERSON_NOT_SUITABLE'
    | 'NO_CAPACITY'
    | 'ANOTHER_REASON'
  outcomeNote?: string | null
}
