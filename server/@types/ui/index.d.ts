import { AccommodationDetail } from '@sas/api'

export interface ErrorSummary {
  text: string
  href: string
}

export interface ErrorMessage {
  text: string
}

export interface ErrorMessages {
  [key: string]: ErrorMessage
}

export type ProposedAddressDto = {
  housingArrangementType: AccommodationDetail['arrangementSubType']
  housingArrangementTypeDescription: string
  settledType: AccommodationDetail['settledType']
  status: AccommodationDetail['status']
  address: AccommodationDetail['address']
}
