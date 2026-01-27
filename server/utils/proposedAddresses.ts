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
import { ProposedAddressDto } from '@sas/api'
import { textContent, htmlContent } from './utils'
import uiPaths from '../paths/ui'
import MultiPageFormManager from './multiPageFormManager'
import { addErrorToFlash } from './validation'
import {
  formatProposedAddressArrangement,
  formatProposedAddressSettledType,
} from './format'

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

export const summaryListRows = (sessionData: ProposedAddressFormData, crn: string) => {
  const addressLines = [...Object.values(sessionData.address || {})].filter(Boolean)

  return [
    {
      key: textContent('Address'),
      value: htmlContent(addressLines.join('<br />')),
      actions: {
        items: [{ text: 'Change', href: uiPaths.proposedAddresses.details({ crn }) }],
      },
    },
    {
      key: textContent(`What will be ${name}'s housing arrangement at this address?`),
      value: htmlContent(formatArrangementWithDescription(sessionData)),
      actions: {
        items: [{ text: 'Change', href: uiPaths.proposedAddresses.type({ crn }) }],
      },
    },
    {
      key: textContent('Will it be settled or transient?'),
      value: textContent(formatProposedAddressSettledType(sessionData.settledType)),
      actions: {
        items: [{ text: 'Change', href: uiPaths.proposedAddresses.type({ crn }) }],
      },
    },
    {
      key: textContent('What is the status of the address checks?'),
      value: textContent(formatProposedAddressStatus(sessionData.status)),
      actions: {
        items: [{ text: 'Change', href: uiPaths.proposedAddresses.status({ crn }) }],
      },
    },
  ]
}

const formatArrangementWithDescription = (data: ProposedAddressFormData) => {
  const type = formatProposedAddressArrangement(data.housingArrangementType)
  if (type === 'Other') {
    return [type, data.housingArrangementTypeDescription || ''].join('<br />')
  }
  return type
}

export const updateAddressFromBody = async (req: Request, formDataManager: MultiPageFormManager<'proposedAddress'>) => {
  const { addressLine1, addressLine2, addressTown, addressCounty, addressPostcode, addressCountry } = req.body || {}
  if (addressLine1 || addressLine2 || addressTown || addressCounty || addressPostcode || addressCountry) {
    const addressParams = {
      line1: String(addressLine1 || ''),
      line2: String(addressLine2 || ''),
      city: String(addressTown || ''),
      region: String(addressCounty || ''),
      postcode: String(addressPostcode || ''),
      country: String(addressCountry || ''),
    }
    await formDataManager.update(req.params.crn, req.session, {
      address: addressParams,
    })
  }
}

export const validateAddressFromSession = (req: Request, sessionData: ProposedAddressFormData) => {
  const address = sessionData?.address
  const errors: Record<string, string> = {}

  if (!address?.line1) {
    errors.addressLine1 = 'Enter address line 1, typically the building and street'
  } else if (address.line1.length > 200) {
    errors.addressLine1 = 'Address line 1 must be 200 characters or less'
  }

  if (address?.line2 && address?.line2.length > 200) {
    errors.addressLine2 = 'Address line 2 must be 200 characters or less'
  }

  if (!address?.postcode) {
    errors.addressPostcode = 'Enter postcode'
  } else if (address.postcode.length > 20) {
    errors.addressPostcode = 'Postal code or zip code must be 20 characters or less'
  }

  if (!address?.city) {
    errors.addressTown = 'Enter town or city'
  } else if (address.city.length > 100) {
    errors.addressTown = 'Town or city must be 100 characters or less'
  }

  if (address?.region && address?.region.length > 100) {
    errors.addressCounty = 'County must be 100 characters or less'
  }

  if (!address?.country) {
    errors.addressCountry = 'Enter country'
  } else if (address.country.length > 100) {
    errors.addressCountry = 'Country must be 100 characters or less'
  }

  if (Object.keys(errors).length > 0) {
    Object.entries(errors).forEach(([key, message]) => {
      addErrorToFlash(req, key, message)
    })
    return false
  }

  return true
}

export const updateTypeFromBody = async (req: Request, formDataManager: MultiPageFormManager<'proposedAddress'>) => {
  const { housingArrangementType, housingArrangementTypeDescription, settledType } = req.body || {}
  if (housingArrangementType || settledType || housingArrangementTypeDescription) {
    await formDataManager.update(req.params.crn, req.session, {
      housingArrangementType: String(housingArrangementType || ''),
      housingArrangementTypeDescription: String(housingArrangementTypeDescription || ''),
      settledType: String(settledType || ''),
    })
  }
}

export const validateTypeFromSession = (req: Request, sessionData: ProposedAddressFormData) => {
  const errors: Record<string, string> = {}
  if (!sessionData?.housingArrangementType) {
    errors.housingArrangementType = 'Select an arrangement type'
  } else if (sessionData.housingArrangementType === 'OTHER' && !sessionData.housingArrangementTypeDescription) {
    errors.housingArrangementTypeDescription = 'Enter the other arrangement type'
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

export const updateStatusFromBody = async (req: Request, formDataManager: MultiPageFormManager<'proposedAddress'>) => {
  const { status } = req.body || {}
  if (status) {
    await formDataManager.update(req.params.crn, req.session, {
      status: String(status),
    })
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

export const mapAddressFormToAddressDto = (formData: ProposedAddressFormData): ProposedAddressDto => {
  const addressDto: ProposedAddressDto = {
    housingArrangementType: formData.housingArrangementType,
    housingArrangementTypeDescription: formData.housingArrangementTypeDescription,
    settledType: formData.settledType,
    status: formData.status,
    address: {
      postcode: formData.address.postcode,
      subBuildingName: formData.address.line2 ?? '',
      buildingName: formData.address.line1,
      postTown: formData.address.city,
      county: formData.address.region ?? '',
      country: formData.address.country,
    },
  }

  return addressDto
}
