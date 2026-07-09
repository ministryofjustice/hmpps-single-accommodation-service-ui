/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssignedToDto } from './AssignedToDto'
import type { CaseAction } from './CaseAction'
export type CaseDto = {
  name?: string | null
  dateOfBirth?: string | null
  crn: string
  prisonNumber?: string | null
  photoUrl?: string | null
  tierScore?: string | null
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
  pncReference?: string | null
  assignedTo?: AssignedToDto | null
  actions: Array<CaseAction>
  userAccess: 'LIMITED' | 'FULL' | 'UNKNOWN'
  limitedAccess?: boolean | null
}
