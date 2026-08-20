/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Cas1PremisesSummaryDto } from './Cas1PremisesSummaryDto'
export type Cas1PlacementSummaryDto = {
  status?: 'ARRIVED' | 'UPCOMING' | 'DEPARTED' | 'NOT_ARRIVED' | 'CANCELLED'
  actualArrivalDate?: string | null
  actualDepartureDate?: string | null
  cancellationReason?: string | null
  premises?: Cas1PremisesSummaryDto | null
}
