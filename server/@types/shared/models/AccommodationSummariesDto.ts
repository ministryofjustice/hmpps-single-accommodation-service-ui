/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AccommodationSummaryDto } from './AccommodationSummaryDto'
export type AccommodationSummariesDto = {
  caseAccommodationStatus?: 'RISK_OF_NO_FIXED_ABODE' | 'NO_FIXED_ABODE' | 'TRANSIENT' | 'SETTLED'
  caseAccommodationStatusDate?: string | null
  currentAccommodation?: AccommodationSummaryDto | null
  nextAccommodation?: AccommodationSummaryDto | null
}
