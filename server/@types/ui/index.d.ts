import { AccommodationDetail } from '@sas/api'
import { SummaryListRow } from '@govuk/ui'

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

export type ProposedAddressFormData = {
  arrangementSubType: AccommodationDetail['arrangementSubType']
  arrangementSubTypeDescription: string
  settledType: AccommodationDetail['settledType']
  verificationStatus: AccommodationDetail['verificationStatus']
  address: AccommodationDetail['address']
  nextAccommodationStatus?: AccommodationDetail['nextAccommodationStatus']
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

export type MultiPageFormData = {
  proposedAddress?: Record<string, ProposedAddressFormData>
}

export type GetCasesQuery = {
  searchTerm?: string
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
  assignedTo?: string
  crns?: string[]
}
