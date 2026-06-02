/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LocalAuthorityDto } from './LocalAuthorityDto'
export type DtrSubmissionDto = {
  id: string
  localAuthority: LocalAuthorityDto
  referenceNumber?: string | null
  submissionDate: string
  createdBy: string
  createdAt: string
  withdrawalReason?:
    | 'NEW_REFERRAL'
    | 'INCORRECT_LOCAL_AUTHORITY'
    | 'NO_CONSENT'
    | 'DISENGAGED'
    | 'HOUSING_NEED_RESOLVED'
    | 'NOT_ELIGIBLE'
    | 'OTHER'
  withdrawalReasonOther?: string | null
  outcomeReason?:
    | 'PREVENTION_AND_RELIEF_DUTY'
    | 'PRIORITY_NEED'
    | 'NO_LOCAL_CONNECTION'
    | 'INTENTIONALLY_HOMELESS'
    | 'REJECTED_FOR_ANOTHER_REASON'
}
