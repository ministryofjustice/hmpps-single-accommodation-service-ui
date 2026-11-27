/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DtrSubmissionDto } from './DtrSubmissionDto'
import type { ServiceResultV2 } from './ServiceResultV2'
export type DtrServiceResultWrapper = {
  serviceResult: ServiceResultV2
  actionPosition: number
  caseId?: string | null
  submission?: DtrSubmissionDto | null
}
