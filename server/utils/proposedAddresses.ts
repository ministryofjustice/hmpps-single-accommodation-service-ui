import { ProposedAddressDisplayStatus, ProposedAddressFormData, StatusCard, StatusTag } from '@sas/ui'
import { AccommodationDetail } from '@sas/api'
import { Request } from 'express'
import { formatDateAndDaysAgo } from './dates'
import { arrangementSubTypes, summaryListRow } from './cases'
import { htmlContent, textContent } from './utils'
import uiPaths from '../paths/ui'
import MultiPageFormManager from './multiPageFormManager'
import { validateAndFlashErrors } from './validation'
import { addressLines, formatAddress } from './addresses'

const proposedAddressStatusTag = (status: ProposedAddressDisplayStatus): StatusTag =>
  ({
    PASSED: { text: 'Passed', colour: 'yellow' },
    NOT_CHECKED_YET: { text: 'Not checked yet', colour: 'red' },
    FAILED: { text: 'Failed' },
    CONFIRMED: { text: 'Confirmed', colour: 'green' },
  })[status] || { text: 'Unknown' }

export const proposedAddressStatusCard = (proposedAddress: AccommodationDetail): StatusCard => {
  const status = displayStatus(proposedAddress.verificationStatus, proposedAddress.nextAccommodationStatus)

  return {
    heading: formatAddress(proposedAddress.address),
    inactive: proposedAddress.verificationStatus === 'FAILED',
    status: proposedAddressStatusTag(status),
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

export const formatProposedAddressStatus = (status?: ProposedAddressDisplayStatus): string => {
  return (
    {
      NOT_CHECKED_YET: 'Not checked yet',
      FAILED: 'Failed',
      PASSED: 'Passed',
      CONFIRMED: 'Confirmed',
    }[status] || 'Unknown'
  )
}
export const formatProposedAddressNextAccommodation = (status: AccommodationDetail['nextAccommodationStatus']) => {
  return (
    {
      YES: 'Yes',
      NO: 'No',
      TO_BE_DECIDED: 'Still to be decided',
    }[status] || 'Unknown'
  )
}

export const formatProposedAddressSettledType = (type?: AccommodationDetail['settledType']): string => {
  return (
    {
      SETTLED: 'Settled',
      TRANSIENT: 'Transient',
    }[type] || 'Unknown'
  )
}

export const formatProposedAddressArrangement = (type?: AccommodationDetail['arrangementSubType']): string => {
  return (
    {
      FRIENDS_OR_FAMILY: 'Friends or family (not tenant or owner)',
      SOCIAL_RENTED: 'Social rent (tenant)',
      PRIVATE_RENTED_WHOLE_PROPERTY: 'Private rent, whole property (tenant)',
      PRIVATE_RENTED_ROOM: 'Private rent, room/share (tenant)',
      OWNED: 'Owned (named on deeds/mortgage)',
      OTHER: 'Other',
    }[type] || 'Unknown'
  )
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
  if (sessionData.verificationStatus === 'PASSED') {
    rows.push({
      key: textContent(`Is this the next address that ${name} will be moving into?`),
      value: htmlContent(formatProposedAddressNextAccommodation(sessionData.nextAccommodationStatus)),
      actions: {
        items: [{ text: 'Change', href: uiPaths.proposedAddresses.nextAccommodation({ crn }) }],
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
  const status = formatProposedAddressStatus(data.verificationStatus)
  if (data.verificationStatus === 'FAILED') {
    return `<p class="govuk-!-margin-bottom-2">${status}</p>Not suitable`
  }
  return status
}

export const updateAddressFromRequest = async (
  req: Request,
  formDataManager: MultiPageFormManager<'proposedAddress'>,
) => {
  const { addressLine1, addressLine2, addressTown, addressCounty, addressPostcode, addressCountry } = req.body || {}

  const addressParams = {
    buildingName: addressLine1 || '',
    subBuildingName: addressLine2 || undefined,
    postTown: addressTown || '',
    county: addressCounty || undefined,
    postcode: addressPostcode || '',
    country: addressCountry || '',
  }
  return formDataManager.update(req.params.crn, req.session, {
    address: addressParams,
  })
}

const validateAddressFromSession = (req: Request, sessionData: ProposedAddressFormData) => {
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

  if (!address?.postTown) {
    errors.addressTown = 'Enter town or city'
  } else if (address.postTown.length > 100) {
    errors.addressTown = 'Town or city must be 100 characters or less'
  }

  if (address?.county && address?.county.length > 100) {
    errors.addressCounty = 'County must be 100 characters or less'
  }

  if (!address?.postcode) {
    errors.addressPostcode = 'Enter postcode'
  } else if (address.postcode.length > 20) {
    errors.addressPostcode = 'Postal code or zip code must be 20 characters or less'
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

  return formDataManager.update(req.params.crn, req.session, {
    arrangementSubType: arrangementSubType as ProposedAddressFormData['arrangementSubType'],
    arrangementSubTypeDescription:
      arrangementSubType === 'OTHER' ? arrangementSubTypeDescription || undefined : undefined,
    settledType: settledType as ProposedAddressFormData['settledType'],
  })
}

const validateTypeFromSession = (req: Request, sessionData: ProposedAddressFormData) => {
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
  const { verificationStatus } = req.body || {}

  return formDataManager.update(req.params.crn, req.session, {
    verificationStatus,
    nextAccommodationStatus: undefined,
  })
}

const validateStatusFromSession = (req: Request, sessionData: ProposedAddressFormData) => {
  const errors: Record<string, string> = {}

  if (!sessionData?.verificationStatus) {
    errors.verificationStatus = 'Select a status'
  }

  return validateAndFlashErrors(req, errors)
}

export const updateNextAccommodationFromRequest = async (
  req: Request,
  formDataManager: MultiPageFormManager<'proposedAddress'>,
) => {
  const { nextAccommodationStatus } = req.body || {}

  return formDataManager.update(req.params.crn, req.session, {
    nextAccommodationStatus,
  })
}

const validateNextAccommodationFromSession = (req: Request, sessionData: ProposedAddressFormData) => {
  const errors: Record<string, string> = {}

  if (sessionData?.verificationStatus === 'PASSED' && !sessionData?.nextAccommodationStatus) {
    errors.nextAccommodationStatus = 'Select if this is the next address'
  }

  return validateAndFlashErrors(req, errors)
}

export const validateUpToAddress = (req: Request, sessionData: ProposedAddressFormData): string | null => {
  return !validateAddressFromSession(req, sessionData)
    ? uiPaths.proposedAddresses.details({ crn: req.params.crn })
    : undefined
}

export const validateUpToType = (req: Request, sessionData: ProposedAddressFormData): string | null => {
  const addressRedirect = validateUpToAddress(req, sessionData)
  if (addressRedirect) return addressRedirect

  return !validateTypeFromSession(req, sessionData)
    ? uiPaths.proposedAddresses.type({ crn: req.params.crn })
    : undefined
}

export const validateUpToStatus = (req: Request, sessionData: ProposedAddressFormData): string | null => {
  const typeRedirect = validateUpToType(req, sessionData)
  if (typeRedirect) return typeRedirect

  return !validateStatusFromSession(req, sessionData)
    ? uiPaths.proposedAddresses.status({ crn: req.params.crn })
    : undefined
}

export const validateUpToNextAccommodation = (req: Request, sessionData: ProposedAddressFormData): string | null => {
  const statusRedirect = validateUpToStatus(req, sessionData)
  if (statusRedirect) return statusRedirect

  return !validateNextAccommodationFromSession(req, sessionData)
    ? uiPaths.proposedAddresses.nextAccommodation({ crn: req.params.crn })
    : undefined
}

export const arrangementSubTypeItems = (arrangementSubType?: AccommodationDetail['arrangementSubType']) =>
  Object.entries(arrangementSubTypes).map(([value, text]) => ({
    value,
    text,
    checked: arrangementSubType === value,
  }))

export const verificationStatusItems = (verificationStatus?: AccommodationDetail['verificationStatus']) => [
  {
    value: 'NOT_CHECKED_YET',
    text: 'Not checked yet',
    checked: verificationStatus === 'NOT_CHECKED_YET',
  },
  {
    value: 'PASSED',
    text: 'Passed',
    checked: verificationStatus === 'PASSED',
  },
  {
    value: 'FAILED',
    text: 'Failed',
    checked: verificationStatus === 'FAILED',
  },
]

export const nextAccommodationStatusItems = (
  nextAccommodationStatus?: AccommodationDetail['nextAccommodationStatus'],
) => [
  {
    value: 'YES',
    text: 'Yes',
    checked: nextAccommodationStatus === 'YES',
  },
  {
    value: 'NO',
    text: 'No',
    checked: nextAccommodationStatus === 'NO',
  },
  {
    value: 'TO_BE_DECIDED',
    text: 'Still to be decided',
    checked: nextAccommodationStatus === 'TO_BE_DECIDED',
  },
]
