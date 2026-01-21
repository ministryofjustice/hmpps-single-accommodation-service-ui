import { AccommodationDetail } from '@sas/api'
import { SummaryListRow } from '@govuk/ui'
import { AddressDetails } from '@sas/api'

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

export type ProposedAddressDisplayStatus = 'CONFIRMED' | AccommodationDetail['verificationStatus']

export interface StatusTag {
  text: string
  colour?: string
}

export interface StatusCard {
  heading: string
  inactive?: boolean
  details?: SummaryListRow[]
  status?: StatusTag
  links?: {
    text: string
    href: string
  }[]
}

export type PrivateAddressFormData = {
  address: AddressDetails & {
    country: string
  }
  arrangement: string
  type: string
  status: string
}

export type MultiPageFormData = {
  privateAddress?: Record<string, PrivateAddressFormData>
}
