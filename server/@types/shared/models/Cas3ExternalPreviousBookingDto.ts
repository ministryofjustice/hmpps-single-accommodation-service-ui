/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Cas3ExternalPreviousBookingCancellationDto } from './Cas3ExternalPreviousBookingCancellationDto'
export type Cas3ExternalPreviousBookingDto = {
  bookingStatus?: 'PROVISIONAL' | 'CONFIRMED' | 'ARRIVED' | 'NOT_MINUS_ARRIVED' | 'DEPARTED' | 'CANCELLED' | 'CLOSED'
  cancellation?: Cas3ExternalPreviousBookingCancellationDto | null
}
