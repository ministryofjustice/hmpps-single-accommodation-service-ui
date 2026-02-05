import { ProposedAddressDisplayStatus, StatusCard, ProposedAddressFormData } from '@sas/ui'
import { AccommodationDetail } from '@sas/api'
import { Request } from 'express'
import {
  formatAddress,
  formatDateAndDaysAgo,
  formatProposedAddressStatus,
  proposedAddressStatusColours,
  addressLines,
  formatProposedAddressArrangement,
  formatProposedAddressSettledType,
  formatProposedAddressConfirmation,
} from './format'
import { arrangementSubTypes, summaryListRow } from './cases'
import { textContent, htmlContent } from './utils'
import uiPaths from '../paths/ui'
import MultiPageFormManager from './multiPageFormManager'
import { validateAndFlashErrors } from './validation'

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

export const summaryListRows = (sessionData: ProposedAddressFormData, crn: string, name: string) => {
  const addressParts = addressLines(sessionData.address || {}, 'full')

  const rows = [
    {
      key: textContent('Address'),
      value: htmlContent(addressParts.join('<br />')),
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
      value: htmlContent(formatStatusWithReason(sessionData)),
      actions: {
        items: [{ text: 'Change', href: uiPaths.proposedAddresses.status({ crn }) }],
      },
    },
  ]
  if (sessionData.status === 'CHECKS_PASSED') {
    rows.push({
      key: textContent(`Is this the next address that ${name} will be moving into?`),
      value: htmlContent(formatProposedAddressConfirmation(sessionData.confirmation)),
      actions: {
        items: [{ text: 'Change', href: uiPaths.proposedAddresses.confirmation({ crn }) }],
      },
    })
  }
  return rows
}

const formatArrangementWithDescription = (data: ProposedAddressFormData) => {
  const type = formatProposedAddressArrangement(data.arrangementSubType)
  if (type === 'Other') {
    return `<p class="govuk-!-margin-bottom-2">${type}</p>${data.arrangementSubTypeDescription || ''}`
  }
  return type
}

const formatStatusWithReason = (data: ProposedAddressFormData) => {
  const status = formatProposedAddressStatus(data.status)
  if (data.status === 'CHECKS_FAILED') {
    return `<p class="govuk-!-margin-bottom-2">${status}</p>Not suitable`
  }
  return status
}

export const updateAddressFromRequest = async (
  req: Request,
  formDataManager: MultiPageFormManager<'proposedAddress'>,
) => {
  const { addressLine1, addressLine2, addressTown, addressCounty, addressPostcode, addressCountry } = req.body || {}
  if (addressLine1 || addressLine2 || addressTown || addressCounty || addressPostcode || addressCountry) {
    const addressParams = {
      buildingName: addressLine1 || '',
      subBuildingName: addressLine2 || undefined,
      postTown: addressTown || '',
      county: addressCounty || undefined,
      postcode: addressPostcode || '',
      country: addressCountry || '',
    }
    await formDataManager.update(req.params.crn, req.session, {
      address: addressParams,
    })
  }
}

export const validateAddressFromSession = (req: Request, sessionData: ProposedAddressFormData) => {
  const address = sessionData?.address
  const errors: Record<string, string> = {}

  if (!address?.buildingName) {
    errors.addressLine1 = 'Enter address line 1, typically the building and street'
  } else if (address.buildingName.length > 200) {
    errors.addressLine1 = 'Address line 1 must be 200 characters or less'
  }

  if (address?.subBuildingName && address?.subBuildingName.length > 200) {
    errors.addressLine2 = 'Address line 2 must be 200 characters or less'
  }

  if (!address?.postcode) {
    errors.addressPostcode = 'Enter postcode'
  } else if (address.postcode.length > 20) {
    errors.addressPostcode = 'Postal code or zip code must be 20 characters or less'
  }

  if (!address?.postTown) {
    errors.addressTown = 'Enter town or city'
  } else if (address.postTown.length > 100) {
    errors.addressTown = 'Town or city must be 100 characters or less'
  }

  if (address?.county && address?.county.length > 100) {
    errors.addressCounty = 'County must be 100 characters or less'
  }

  if (!address?.country) {
    errors.addressCountry = 'Enter country'
  } else if (address.country.length > 100) {
    errors.addressCountry = 'Country must be 100 characters or less'
  }

  return validateAndFlashErrors(req, errors)
}

export const updateTypeFromRequest = async (req: Request, formDataManager: MultiPageFormManager<'proposedAddress'>) => {
  const { arrangementSubType, arrangementSubTypeDescription, settledType } = req.body || {}
  if (arrangementSubType || settledType || arrangementSubTypeDescription) {
    await formDataManager.update(req.params.crn, req.session, {
      arrangementSubType: arrangementSubType as ProposedAddressFormData['arrangementSubType'],
      arrangementSubTypeDescription:
        arrangementSubType === 'OTHER' ? arrangementSubTypeDescription || undefined : undefined,
      settledType: settledType as ProposedAddressFormData['settledType'],
    })
  }
}

export const validateTypeFromSession = (req: Request, sessionData: ProposedAddressFormData) => {
  const errors: Record<string, string> = {}
  if (!sessionData?.arrangementSubType) {
    errors.arrangementSubType = 'Select an arrangement type'
  } else if (sessionData.arrangementSubType === 'OTHER' && !sessionData.arrangementSubTypeDescription) {
    errors.arrangementSubTypeDescription = 'Enter the other arrangement type'
  }
  if (!sessionData?.settledType) {
    errors.settledType = 'Select a settled type'
  }

  return validateAndFlashErrors(req, errors)
}

export const updateStatusFromRequest = async (
  req: Request,
  formDataManager: MultiPageFormManager<'proposedAddress'>,
) => {
  const { status } = req.body || {}
  if (status) {
    await formDataManager.update(req.params.crn, req.session, {
      status,
      confirmation: undefined,
    })
  }
}

export const validateStatusFromSession = (req: Request, sessionData: ProposedAddressFormData) => {
  const errors: Record<string, string> = {}

  if (!sessionData?.status) {
    errors.status = 'Select a status'
  }

  return validateAndFlashErrors(req, errors)
}

export const updateConfirmationFromRequest = async (
  req: Request,
  formDataManager: MultiPageFormManager<'proposedAddress'>,
) => {
  const { confirmation } = req.body || {}
  if (confirmation) {
    await formDataManager.update(req.params.crn, req.session, {
      confirmation,
    })
  }
}

export const validateConfirmationFromSession = (req: Request, sessionData: ProposedAddressFormData) => {
  const errors: Record<string, string> = {}

  if (sessionData?.status === 'CHECKS_PASSED' && !sessionData?.confirmation) {
    errors.confirmation = 'Select if this is the next address'
  }

  return validateAndFlashErrors(req, errors)
}
