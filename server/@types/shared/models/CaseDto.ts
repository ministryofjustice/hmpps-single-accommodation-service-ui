/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AccommodationSummaryDto } from './AccommodationSummaryDto'
import type { AssignedToDto } from './AssignedToDto'
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
  currentAccommodation?: AccommodationSummaryDto | null
  nextAccommodation?: AccommodationSummaryDto | null
  status?: 'RISK_OF_NO_FIXED_ABODE' | 'NO_FIXED_ABODE' | 'TRANSIENT' | 'SETTLED'
  actions: Array<string>
  userAccess: 'LIMITED' | 'FULL' | 'UNKNOWN'
  limitedAccess?: boolean | null
}
