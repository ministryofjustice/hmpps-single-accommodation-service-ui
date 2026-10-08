/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ExternalReferralSubmissionDto } from './ExternalReferralSubmissionDto'
export type ExternalReferralDto = {
  caseId: string
  crn: string
  status: 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'ARCHIVED'
  submission: ExternalReferralSubmissionDto
}
