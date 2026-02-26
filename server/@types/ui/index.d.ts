import { AccommodationAddressDetails, AccommodationDetail, AccommodationDetailCommand } from '@sas/api'
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

export type ProposedAddressFormData = Partial<AccommodationDetailCommand> & {
  flow: 'full' | 'details' | 'type' | 'status' | 'nextAccommodation'
  id?: string
  nameOrNumber?: string
  postcode?: string
  lookupResults?: AccommodationAddressDetails[] | null
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

export type DividerItem = {
  divider: string
}

export type RadioItem = {
  text: string
  value: string
  checked?: boolean
  conditional?: {
    html: string
  }
}

export type CheckboxItem = {
  text: string
  value: string
  checked?: boolean
}

// See: https://docs.os.uk/os-apis/accessing-os-apis/os-places-api/technical-specification/postcode
export type OsDataHubResult = {
  DPA: {
    ORGANISATION_NAME?: string
    DEPARTMENT_NAME?: string
    BUILDING_NUMBER?: string
    BUILDING_NAME?: string
    SUB_BUILDING_NAME?: string
    DEPENDENT_THOROUGHFARE_NAME?: string
    THOROUGHFARE_NAME?: string
    DOUBLE_DEPENDENT_LOCALITY?: string
    DEPENDENT_LOCALITY?: string
    POST_TOWN: string
    POSTCODE: string
    COUNTRY_CODE: string
    COUNTRY_CODE_DESCRIPTION: string
    ADDRESS: string
    UPRN: string
    UDPRN: string
  }
}

export type OsDataHubResponse = {
  header: unknown
  results: OsDataHubResult[]
}
