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
  outcomeNote?: string | null
}
