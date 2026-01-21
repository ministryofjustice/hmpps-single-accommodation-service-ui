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
