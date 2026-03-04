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

export interface SelectOption {
  text: string
  value: string
  selected?: boolean
}

export type ObjectWithDateParts<K extends string | number> = { [P in `${K}-${'year' | 'month' | 'day'}`]?: string } & {
  [P in `${K}-time`]?: string
} & {
  [P in K]?: string
}
