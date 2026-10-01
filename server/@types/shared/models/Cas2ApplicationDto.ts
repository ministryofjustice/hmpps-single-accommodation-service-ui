/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Cas2StaffDto } from './Cas2StaffDto'
import type { Cas2SubmittedApplicationSummaryDto } from './Cas2SubmittedApplicationSummaryDto'
export type Cas2ApplicationDto = {
  uiUrl: string
  id: string
  createdAt: string
  createdBy: Cas2StaffDto
  submittedApplication?: Cas2SubmittedApplicationSummaryDto | null
  cohort?:
    | 'ALTERNATIVE_TO_CUSTODIAL_RECALL'
    | 'HOMELESS_AT_CONDITIONAL_RELEASE_DATE'
    | 'HOMELESS_AT_END_OF_FIXED_TERM_RECALL'
    | 'INTENSIVE_SUPERVISION_COURTS'
    | 'RISK_ASSESSED_RECALL_REVIEW'
    | 'REFERRAL_FROM_APPROVED_PREMISES'
    | 'UNKNOWN'
}
