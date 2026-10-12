/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Cas1StaffDto } from './Cas1StaffDto'
export type Cas1ApplicationSummaryDto = {
  id: string
  status:
    | 'AWAITING_ASSESSMENT'
    | 'UNALLOCATED_ASSESSMENT'
    | 'ASSESSMENT_IN_PROGRESS'
    | 'AWAITING_PLACEMENT'
    | 'PLACEMENT_ALLOCATED'
    | 'REQUESTED_FURTHER_INFORMATION'
    | 'PENDING_PLACEMENT_REQUEST'
    | 'STARTED'
    | 'REJECTED'
    | 'INAPPLICABLE'
    | 'WITHDRAWN'
    | 'EXPIRED'
  createdAt: string
  createdBy: Cas1StaffDto
  submittedAt?: string | null
  expiresAt?: string | null
}
