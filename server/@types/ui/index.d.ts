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

export type DutyToReferDto = {
    crn: string;
    serviceStatus: 'NOT_STARTED' | 'SUBMITTED' | 'ACCEPTED' | 'NOT_ACCEPTED';
    action?: string;
    submission?: {
        id: string;
        localAuthorityId: string;
        localAuthorityName: string;
        referenceNumber: string;
        submissionDate: string;
        outcomeStatus?: string;
        outcomeDate?: string;
        createdBy: string;
        createdAt: string;
        updatedAt: string;
    }
};

export type SubmitDutyToRefer = {
  localAuthorityId: string
  submissionDate: string
  referenceNumber?: string
}

export type UpdateDutyToRefer = {
  localAuthorityId: string
  submissionDate: string
  referenceNumber?: string
  outcomeStatus: 'NOT_STARTED' | 'ACCEPTED' | 'NOT_ACCEPTED' | 'SUBMITTED'
  outcomeDate?: string | null
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
