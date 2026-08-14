/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AccommodationSummariesDto } from './AccommodationSummariesDto'
import type { AssignedToDto } from './AssignedToDto'
import type { AccommodationSummaryDto } from './AccommodationSummaryDto'

export type CaseDto = {
  forename?: string | null
  middleNames?: string | null
  surname?: string | null
  dateOfBirth?: string | null
  crn: string
  prisonNumber?: string | null
  photoUrl?: string | null
  tierScore?: string | null
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
  pncReference?: string | null
  assignedTo?: AssignedToDto | null
  userAccess: 'LIMITED' | 'FULL' | 'UNKNOWN'
  limitedAccess?: boolean | null
  accommodationSummaries?: AccommodationSummariesDto | null
}
