/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LocalAuthorityDto } from './LocalAuthorityDto'
export type OtherAccommodationReferralSubmissionDto = {
  id: string
  localAuthority: LocalAuthorityDto
  referenceNumber?: string | null
  submissionDate: string
  createdBy: string
  createdByUsername: string
  createdAt: string
  organisationName?: string | null
  website?: string | null
  submissionNote?: string | null
  outcomeReason?:
    | 'ACCEPTED_BY_ORGANISATION'
    | 'ACCEPTED_WITH_ACCOMMODATION_PLACEMENT'
    | 'PERSON_NOT_SUITABLE'
    | 'NO_CAPACITY'
    | 'ANOTHER_REASON'
  outcomeNote?: string | null
}
