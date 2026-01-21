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

export type ProposedAddressFormData = {
  address: AddressDetails & {
    country: string
  }
  settledType: string
  type: string
  status: string
}

export type MultiPageFormData = {
  proposedAddress?: Record<string, ProposedAddressFormData>
}
