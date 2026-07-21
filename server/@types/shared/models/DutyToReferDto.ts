/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DtrSubmissionDto } from './DtrSubmissionDto'
export type DutyToReferDto = {
  caseId: string
  crn: string
  status: 'SUBMITTED' | 'ACCEPTED' | 'NOT_ACCEPTED' | 'WITHDRAWN'
  submission?: DtrSubmissionDto | null
  active?: boolean | null
}
