import { ProposedAddressDisplayStatus, ProposedAddressFormData, RadioItem, StatusCard, StatusTag } from '@sas/ui'
import {
  AccommodationAddressDetails,
  AccommodationDetail,
  AccommodationDetailCommand,
  AuditRecordDto,
  FieldChange,
} from '@sas/api'
import { Request } from 'express'
import { SummaryListRow, TimelineEntry } from '@govuk/ui'
import { formatDateAndDaysAgo } from './dates'
import { arrangementSubTypes, summaryListRow } from './cases'
import { htmlContent, textContent, toParagraphs } from './utils'
import uiPaths from '../paths/ui'
import MultiPageFormManager from './multiPageFormManager'
import { isValidUKPostcode, validateAndFlashErrors } from './validation'
import { addressLines, formatAddress } from './addresses'
import { renderMacro, statusTag } from './macros'
import { timelineEntry } from './timeline'

export const proposedAddressStatusTag = (status: ProposedAddressDisplayStatus): StatusTag =>
  ({
    PASSED: { text: 'Checks passed', colour: 'yellow' },
    NOT_CHECKED_YET: { text: 'Not checked yet', colour: 'red' },
    FAILED: { text: 'Checks failed', colour: 'grey' },
    CONFIRMED: { text: 'Confirmed', colour: 'green' },
  })[status]

export const proposedAddressStatusCard = (proposedAddress: AccommodationDetail): StatusCard => {
  const status = displayStatus(proposedAddress)

  return {
    heading: formatAddress(proposedAddress.address),
    inactive: proposedAddress.verificationStatus === 'FAILED',
    status: proposedAddressStatusTag(status),
    details: [
      summaryListRow('Housing arrangement', arrangementLabel(proposedAddress)),
      summaryListRow('Added by', ''),
      summaryListRow('Date added', formatDateAndDaysAgo(proposedAddress.createdAt)),
    ],
    links: linksForStatus(status, proposedAddress.crn, proposedAddress.id),
  }
}

const linksForStatus = (status: ProposedAddressDisplayStatus, crn: string, id: string) => {
  const detailsLink = uiPaths.proposedAddresses.show({ crn, id })

  switch (status) {
    case 'PASSED':
      return [
        {
          text: 'Confirm as next address',
          href: `${uiPaths.proposedAddresses.edit({ crn, id })}?flow=nextAccommodation`,
        },
        { text: 'Notes', href: detailsLink },
      ]
    case 'NOT_CHECKED_YET':
      return [
        { text: 'Add checks', href: `${uiPaths.proposedAddresses.edit({ crn, id })}?flow=status` },
        { text: 'Notes', href: detailsLink },
      ]
    default:
      return [{ text: 'Notes', href: detailsLink }]
  }
}

const settledTypes: Record<AccommodationDetail['settledType'], string> = {
  SETTLED: 'Settled',
  TRANSIENT: 'Transient',
}

export const flowRedirects: Record<string, (params: { crn: string }) => string> = {
  status: uiPaths.proposedAddresses.status,
  nextAccommodation: uiPaths.proposedAddresses.nextAccommodation,
  type: uiPaths.proposedAddresses.type,
  details: uiPaths.proposedAddresses.details,
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

export const displayStatus = (proposedAddress: AccommodationDetail): ProposedAddressDisplayStatus =>
  proposedAddress.nextAccommodationStatus === 'YES' ? 'CONFIRMED' : proposedAddress.verificationStatus

export const formatProposedAddressStatus = (status?: ProposedAddressDisplayStatus): string =>
  ({
    NOT_CHECKED_YET: 'Not checked yet',
    FAILED: 'Failed',
    PASSED: 'Passed',
    CONFIRMED: 'Confirmed',
  })[status]

export const formatProposedAddressNextAccommodation = (status: AccommodationDetail['nextAccommodationStatus']) =>
  ({
    YES: 'Yes',
    NO: 'No',
    TO_BE_DECIDED: 'Still to be decided',
  })[status]

export const formatProposedAddressSettledType = (type?: AccommodationDetail['settledType']): string =>
  ({
    SETTLED: 'Settled',
    TRANSIENT: 'Transient',
  })[type]

export const formatProposedAddressArrangement = (type?: AccommodationDetail['arrangementSubType']): string =>
  ({
    FRIENDS_OR_FAMILY: 'Friends or family (not tenant or owner)',
    SOCIAL_RENTED: 'Social rent (tenant)',
    PRIVATE_RENTED_WHOLE_PROPERTY: 'Private rent, whole property (tenant)',
    PRIVATE_RENTED_ROOM: 'Private rent, room/share (tenant)',
    OWNED: 'Owned (named on deeds/mortgage)',
    OTHER: 'Other',
  })[type]

export const checkYourAnswersRows = (
  sessionData: ProposedAddressFormData,
  crn: string,
  name: string,
): SummaryListRow[] => {
  const addressParts = addressLines(sessionData.address || {}, 'full')
  const changeAddressLink = sessionData.lookupResults
    ? uiPaths.proposedAddresses.lookup({ crn })
    : uiPaths.proposedAddresses.details({ crn })

  const rows = [
    {
      key: textContent('Address'),
      value: htmlContent(addressParts.join('<br />')),
      actions: {
        items: [{ text: 'Change', href: changeAddressLink }],
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

const formatArrangementWithDescription = (data: ProposedAddressFormData | AccommodationDetail) => {
  const type = formatProposedAddressArrangement(data.arrangementSubType)
  if (type === 'Other') {
    return toParagraphs([type, data.arrangementSubTypeDescription])
  }
  return type
}

const formatStatusWithReason = (data: ProposedAddressFormData) => {
  const status = formatProposedAddressStatus(data.verificationStatus)
  if (data.verificationStatus === 'FAILED') {
    return toParagraphs([status, 'Not suitable'])
  }
  return status
}

export const validateLookupFromSession = (req: Request, sessionData: ProposedAddressFormData) => {
  const errors: Record<string, string> = {}

  if (!sessionData.nameOrNumber) errors.nameOrNumber = 'Enter a property name or number'
  if (!sessionData.postcode) {
    errors.postcode = 'Enter a UK postcode'
  } else if (!isValidUKPostcode(sessionData.postcode)) {
    errors.postcode = 'Enter a full UK postcode, like AA3 1AB'
  }

  return !validateAndFlashErrors(req, errors) ? uiPaths.proposedAddresses.lookup({ crn: req.params.crn }) : undefined
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

  if (!address?.buildingName && !address?.thoroughfareName) {
    errors.addressLine1 = 'Enter address line 1, typically the building and street'
  } else if (!address?.thoroughfareName && address.buildingName.length > 200) {
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

export const formDataToRequestBody = ({
  arrangementSubType,
  arrangementSubTypeDescription,
  settledType,
  address,
  verificationStatus,
  nextAccommodationStatus,
}: ProposedAddressFormData): AccommodationDetailCommand => ({
  arrangementType: 'PRIVATE',
  arrangementSubType,
  arrangementSubTypeDescription,
  settledType,
  address,
  verificationStatus,
  nextAccommodationStatus: nextAccommodationStatus ?? 'TO_BE_DECIDED',
})

export const lookupResultsItems = (results: AccommodationAddressDetails[], selectedUprn?: string): RadioItem[] =>
  results.map(result => ({
    value: result.uprn,
    text: formatAddress(result),
    checked: selectedUprn === result.uprn,
  }))

export const housingArrangementParts = (proposedAddress: AccommodationDetail): string[] => {
  const type = formatProposedAddressArrangement(proposedAddress.arrangementSubType)
  const description = proposedAddress.arrangementSubType === 'OTHER' && proposedAddress.arrangementSubTypeDescription
  return [type, description].filter(Boolean)
}

export const addressDetailRows = (proposedAddress: AccommodationDetail): SummaryListRow[] =>
  [
    summaryListRow('Status', statusTag(proposedAddressStatusTag(displayStatus(proposedAddress))), 'html'),
    summaryListRow('Address', formatAddress(proposedAddress.address, '<br />'), 'html'),
    summaryListRow(
      'Housing arrangement',
      toParagraphs([
        housingArrangementParts(proposedAddress).join(', '),
        formatProposedAddressSettledType(proposedAddress.settledType),
      ]),
      'html',
    ),
    summaryListRow('Address checks', formatProposedAddressStatus(proposedAddress.verificationStatus)),
    proposedAddress.verificationStatus === 'PASSED' &&
      summaryListRow('Next address', formatProposedAddressNextAccommodation(proposedAddress.nextAccommodationStatus)),
  ].filter(Boolean)

const auditRecordChangesToProposedAddress = (auditRecord: AuditRecordDto): AccommodationDetail => {
  const addressFields = [
    'buildingNumber',
    'buildingName',
    'subBuildingName',
    'thoroughfareName',
    'dependentLocality',
    'postTown',
    'postcode',
    'county',
    'country',
    'uprn',
  ]

  const filterChanges = (predicate: (change: FieldChange) => boolean) =>
    Object.fromEntries(auditRecord.changes.filter(predicate).map(change => [change.field, change.value]))

  return {
    ...filterChanges(change => !addressFields.includes(change.field)),
    address: filterChanges(change => addressFields.includes(change.field)),
  } as AccommodationDetail
}

export const addressTimelineEntry = (auditRecord: AuditRecordDto): TimelineEntry => {
  const { type } = auditRecord
  const proposedAddress = auditRecordChangesToProposedAddress(auditRecord)

  const housingArrangement = [
    housingArrangementParts(proposedAddress).join(', '),
    formatProposedAddressSettledType(proposedAddress.settledType),
  ]
    .filter(Boolean)
    .map(text => `${text}. `)
    .join('')

  const addressChecks = formatProposedAddressStatus(proposedAddress.verificationStatus)

  const nextAddress =
    type === 'UPDATE' || proposedAddress.verificationStatus === 'PASSED'
      ? formatProposedAddressNextAccommodation(proposedAddress.nextAccommodationStatus)
      : undefined

  const label = type === 'CREATE' ? 'Address created' : 'Address updated'
  const html = renderMacro('timelineProposedAddress', {
    type,
    status: proposedAddressStatusTag(displayStatus(proposedAddress)),
    values: {
      Address: formatAddress(proposedAddress.address),
      'Housing arrangement': housingArrangement,
      'Address checks': addressChecks,
      'Next address': nextAddress,
    },
  })

  return timelineEntry(label, html, auditRecord.commitDate, auditRecord.author)
}
