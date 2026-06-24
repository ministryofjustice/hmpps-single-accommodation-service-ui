import {
  AccommodationAddressDetails,
  ProposedAccommodationDetailCommand,
  ProposedAccommodationDto,
  UpstreamFailureDto,
} from '@sas/api'
import { SummaryListRow } from '@govuk/ui'
import { Request } from 'express'

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

export type ProposedAddressFormPage = 'lookup' | 'details' | 'type' | 'status' | 'nextAccommodation'

export type ProposedAddressFormData = Partial<ProposedAccommodationDetailCommand> & {
  redirect?: string
  id?: string
  nameOrNumber?: string
  postcode?: string
  lookupResults?: AccommodationAddressDetails[] | null
}

export type ProposedAddressDisplayStatus = 'CONFIRMED' | ProposedAccommodationDto['verificationStatus']

export interface StatusTag {
  text: string
  colour?: string
}

export interface StatusCell {
  status: StatusTag
  dateText?: string
  details?: Array<TextOrHtmlContent>
}

export interface StatusCard {
  heading: string
  inactive?: boolean
  hint?: string
  details?: SummaryListRow[]
  status?: StatusTag
  links?: {
    text: string
    href: string
  }[]
}

export type Link = {
  text: string
  href: string
}

export type MultiPageFormData = {
  proposedAddress?: Record<string, ProposedAddressFormData>
}

export type GetCasesQuery = {
  searchTerm?: string
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
  teamCode?: string
}

export interface IndexRequest extends Request {
  query: GetCasesQuery
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

export type DateFieldValues<K extends string> = { [P in `${K}-${'year' | 'month' | 'day'}`]?: string }

export type ApiResponse = {
  data?: unknown
  upstreamFailures?: UpstreamFailureDto[]
}
