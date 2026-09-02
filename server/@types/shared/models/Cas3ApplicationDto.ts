/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Cas3PremisesSummaryDto } from './Cas3PremisesSummaryDto'
import type { Cas3StaffDto } from './Cas3StaffDto'
export type Cas3ApplicationDto = {
  id: string
  applicationStatus: 'IN_PROGRESS' | 'SUBMITTED' | 'REQUESTED_FURTHER_INFORMATION' | 'REJECTED'
  applicationSubmittedDate?: string | null
  applicationSubmittedBy: Cas3StaffDto
  applicationRejectedReason?: string | null
  assessmentStatus?: 'UNALLOCATED' | 'IN_REVIEW' | 'READY_TO_PLACE' | 'CLOSED' | 'REJECTED'
  bookingStatus?: 'PROVISIONAL' | 'CONFIRMED' | 'ARRIVED' | 'NOT_MINUS_ARRIVED' | 'DEPARTED' | 'CANCELLED' | 'CLOSED'
  bookingProvisionalOfferSentDate?: string | null
  previousBookings?: any[] | null
  premises?: Cas3PremisesSummaryDto | null
  uiUrl: string
}
