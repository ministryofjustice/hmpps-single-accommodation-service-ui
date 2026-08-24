/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Cas1ApplicationSummaryDto } from './Cas1ApplicationSummaryDto'
import type { Cas1AssessmentSummaryDto } from './Cas1AssessmentSummaryDto'
import type { Cas1PlacementPairDto } from './Cas1PlacementPairDto'
import type { Cas1PlacementSummaryDto } from './Cas1PlacementSummaryDto'
import type { Cas1RequestForPlacementSummaryDto } from './Cas1RequestForPlacementSummaryDto'
export type Cas1ApplicationDto = {
  uiUrl: string
  application: Cas1ApplicationSummaryDto
  assessment?: Cas1AssessmentSummaryDto | null
  requestForPlacement?: Cas1RequestForPlacementSummaryDto | null
  placement?: Cas1PlacementSummaryDto | null
  placementHistory: Array<Cas1PlacementPairDto>
  /**
   * This field will be removed once SAS is updated to use application.id
   * @deprecated
   */
  id: string
  /**
   * This field will be removed once SAS is updated to use application.status
   * @deprecated
   */
  applicationStatus:
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
  /**
   * This field will be removed once SAS is updated to use requestForPlacement.status
   * @deprecated
   */
  requestForPlacementStatus?:
    | 'REQUEST_UNSUBMITTED'
    | 'REQUEST_REJECTED'
    | 'REQUEST_SUBMITTED'
    | 'AWAITING_MATCH'
    | 'REQUEST_WITHDRAWN'
    | 'PLACEMENT_BOOKED'
  /**
   * This field will be removed once SAS is updated to use placement.status
   * @deprecated
   */
  placementStatus?: 'ARRIVED' | 'UPCOMING' | 'DEPARTED' | 'NOT_ARRIVED' | 'CANCELLED'
}
