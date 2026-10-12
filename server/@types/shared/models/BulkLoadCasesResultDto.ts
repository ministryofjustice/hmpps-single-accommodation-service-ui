/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BulkLoadCasesErrorDto } from './BulkLoadCasesErrorDto'
export type BulkLoadCasesResultDto = {
  dryRun: boolean
  teamsProcessed: number
  crnsFound: number
  casesAlreadyPresent: number
  casesCreated: number
  refreshesRequested: number
  errors: Array<BulkLoadCasesErrorDto>
}
