import { ProposedAddressDisplayStatus, StatusCard } from '@sas/ui'
import { AccommodationDetail } from '@sas/api'
import {
  formatAddress,
  formatDateAndDaysAgo,
  formatProposedAddressStatus,
  proposedAddressStatusColours,
} from './format'
import { arrangementSubTypes, summaryListRow } from './cases'
import { Request } from 'express'
import { ProposedAddressFormData } from '@sas/ui'
import { textContent, htmlContent } from './utils'
import uiPaths from '../paths/ui'
import MultiPageFormManager from './multiPageFormManager'
import { addErrorToFlash } from './validation'

// eslint-disable-next-line import/prefer-default-export
export const proposedAddressStatusCard = (proposedAddress: AccommodationDetail): StatusCard => {
  const status = displayStatus(proposedAddress.verificationStatus, proposedAddress.nextAccommodationStatus)

  return {
    heading: formatAddress(proposedAddress.address),
    inactive: proposedAddress.verificationStatus === 'FAILED',
    status: {
      text: formatProposedAddressStatus(status),
      colour: proposedAddressStatusColours[status],
    },
    details: [
      summaryListRow('Housing arrangement', arrangementLabel(proposedAddress)),
      summaryListRow('Added by', ''),
      summaryListRow('Date added', formatDateAndDaysAgo(proposedAddress.createdAt)),
    ],
    links: linksForStatus(status),
  }
}

const linksForStatus = (status: ProposedAddressDisplayStatus) => {
  switch (status) {
    case 'PASSED':
      return [
        { text: 'Confirm as next address', href: '#' },
        { text: 'Notes', href: '#' },
      ]
    case 'NOT_CHECKED_YET':
      return [
        { text: 'Add checks', href: '#' },
        { text: 'Notes', href: '#' },
      ]
    default:
      return [{ text: 'Notes', href: '#' }]
  }
}

const settledTypes: Record<AccommodationDetail['settledType'], string> = {
  SETTLED: 'Settled',
  TRANSIENT: 'Transient',
}

const arrangementLabel = (proposedAddress: AccommodationDetail) => {
  const { arrangementSubType, arrangementSubTypeDescription, settledType } = proposedAddress
  const settledLabel = settledType ? `${settledTypes[settledType]}.` : ''

  switch (arrangementSubType) {
    case 'OTHER':
      return `Other: ${arrangementSubTypeDescription}. ${settledLabel}`
    default:
      return `${arrangementSubTypes[arrangementSubType]}. ${settledLabel}`
  }
}

const displayStatus = (
  status?: AccommodationDetail['verificationStatus'],
  nextAccommodationStatus?: AccommodationDetail['nextAccommodationStatus'],
): ProposedAddressDisplayStatus => {
  if (status === 'PASSED' && nextAccommodationStatus === 'YES') return 'CONFIRMED'
  return status
}

export const summaryListRows = (proposedAddressFormSessionData: ProposedAddressFormData, crn: string) => {
  const addressLines = [...Object.values(proposedAddressFormSessionData.address || {})].filter(Boolean)

  return [
    {
      key: textContent('Address'),
      value: htmlContent(addressLines.join('<br />')),
      actions: {
        items: [{ text: 'Change', href: uiPaths.proposedAddresses.details({ crn }) }],
      },
    },
    {
      key: textContent("What will be James Taylor's housing arrangement at this address?"),
      value: textContent(proposedAddressFormSessionData.type),
      actions: {
        items: [{ text: 'Change', href: uiPaths.proposedAddresses.type({ crn }) }],
      },
    },
    {
      key: textContent('Will it be settled or transient?'),
      value: textContent(proposedAddressFormSessionData.settledType),
      actions: {
        items: [{ text: 'Change', href: uiPaths.proposedAddresses.type({ crn }) }],
      },
    },
    {
      key: textContent('What is the status of the address checks?'),
      value: textContent(proposedAddressFormSessionData.status),
      actions: {
        items: [{ text: 'Change', href: uiPaths.proposedAddresses.status({ crn }) }],
      },
    },
  ]
}

export const updateAddressFromQuery = async (req: Request, formDataManager: MultiPageFormManager<'proposedAddress'>) => {
  const { addressLine1, addressLine2, addressTown, addressCounty, addressPostcode, addressCountry } = req.query || {}
  if (addressLine1 || addressLine2 || addressTown || addressCounty || addressPostcode || addressCountry) {
    const addressParams = {
      line1: (addressLine1 as string) || '',
      line2: (addressLine2 as string) || '',
      city: (addressTown as string) || '',
      region: (addressCounty as string) || '',
      postcode: (addressPostcode as string) || '',
      country: (addressCountry as string) || '',
    }
    await formDataManager.update(req.params.crn, req.session, {
      address: addressParams,
    })
  }
}

export const validateAddressFromSession = (req: Request, sessionData: ProposedAddressFormData) => {
  const address = sessionData?.address
  const errors: Record<string, string> = {}

  if (!address.line1) {
    errors.addressLine1 = 'Enter address line 1'
  }
  if (!address.postcode) {
    errors.addressPostcode = 'Enter postcode'
  }
  if (!address.city) {
    errors.addressTown = 'Enter town or city'
  }
  if (!address.country) {
    errors.addressCountry = 'Enter country'
  }

  if (Object.keys(errors).length > 0) {
    Object.entries(errors).forEach(([key, message]) => {
      addErrorToFlash(req, key, message)
    })
    return false
  }

  return true
}

export const updateTypeFromQuery = async (
  req: Request,
  formDataManager: MultiPageFormManager<'proposedAddress'>,
) => {
  const { type, settledType } = req.query || {}
  if (type || settledType) {
    {
      await formDataManager.update(req.params.crn, req.session, {
        type: (type as string) || '',
        settledType: (settledType as string) || '',
      })
    }
  }
}

export const validateTypeFromSession = (req: Request, sessionData: ProposedAddressFormData) => {
  const errors: Record<string, string> = {}
  if (!sessionData?.type) {
    errors.type = 'Select a type'
  }
  if (!sessionData?.settledType) {
    errors.settledType = 'Select a settled type'
  }

  if (Object.keys(errors).length > 0) {
    Object.entries(errors).forEach(([key, message]) => {
      addErrorToFlash(req, key, message)
    })
    return false
  }

  return true
}

export const updateStatusFromQuery = async (req: Request, formDataManager: MultiPageFormManager<'proposedAddress'>) => {
  const { status } = req.query || {}
  if (status) {
    {
      await formDataManager.update(req.params.crn, req.session, {
        status: (status as string) || '',
      })
    }
  }
}

export const validateStatusFromSession = (req: Request, sessionData: ProposedAddressFormData) => {
  const errors: Record<string, string> = {}
  if (!sessionData?.status) {
    errors.status = 'Select a status'
  }

  if (Object.keys(errors).length > 0) {
    Object.entries(errors).forEach(([key, message]) => {
      addErrorToFlash(req, key, message)
    })
    return false
  }

  return true
}
