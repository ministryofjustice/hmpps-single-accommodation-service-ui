import {
  AuditFieldValues,
  ProposedAddressDisplayStatus,
  ProposedAddressFormData,
  ProposedAddressFormPage,
  RadioItem,
  StatusCard,
  StatusTag,
} from '@sas/ui'
import {
  AccommodationAddressDetails,
  AuditRecordDto,
  FieldChange,
  ProposedAccommodationDetailCommand,
  ProposedAccommodationDto,
  ReferenceDataDto,
} from '@sas/api'
import { Request } from 'express'
import { Button, SummaryListActionItem, SummaryListRow, TimelineEntry } from '@govuk/ui'
import { formatDateAndDaysAgo } from './dates'
import { summaryListRowText, summaryListRowHtml, toParagraphs } from './utils'
import uiPaths from '../paths/ui'
import MultiPageFormManager from './multiPageFormManager'
import {
  validateAndFlashErrors,
  validateMandatoryText,
  validateMaxLength,
  validatePostcode,
  validateRadioButton,
} from './validation'
import { addressLines, formatAddress } from './addresses'
import { renderMacro, statusTag } from './macros'
import { noteTimelineEntry, timelineEntry } from './timeline'
import config from '../config'

export const proposedAddressStatusTag = (status: ProposedAddressDisplayStatus): StatusTag =>
  ({
    PASSED: { text: 'Checks passed', colour: 'yellow' },
    NOT_CHECKED_YET: { text: 'Not checked', colour: 'orange' },
    FAILED: { text: 'Checks failed', colour: 'grey' },
    CONFIRMED: { text: 'Confirmed', colour: 'green' },
  })[status]

export const proposedAddressStatusCard = (proposedAddress: ProposedAccommodationDto): StatusCard => {
  const status = displayStatus(proposedAddress)

  return {
    heading: formatAddress(proposedAddress.address),
    inactive: proposedAddress.verificationStatus === 'FAILED',
    status: proposedAddressStatusTag(status),
    details: [
      proposedAddress.accommodationType?.description &&
        summaryListRowText('Housing arrangement', proposedAddress.accommodationType.description),
      summaryListRowText('Added by', proposedAddress.createdBy),
      summaryListRowText('Date added', formatDateAndDaysAgo(proposedAddress.createdAt)),
    ].filter(Boolean),
    links: linksForStatus(status, proposedAddress.crn, proposedAddress.id),
  }
}

const linksForStatus = (status: ProposedAddressDisplayStatus, crn: string, id: string) => {
  const detailsLink = { text: 'View details', href: uiPaths.proposedAddresses.show({ crn, id }) }

  switch (status) {
    case 'PASSED':
      return [
        {
          text: 'Set as next address',
          href: uiPaths.proposedAddresses.edit({ crn, id, page: 'nextAccommodation' }),
        },
        detailsLink,
      ]
    case 'NOT_CHECKED_YET':
      return [{ text: 'Add checks', href: uiPaths.proposedAddresses.edit({ crn, id, page: 'status' }) }, detailsLink]
    case 'CONFIRMED':
      if (config.flags.hideSetAsCurrentAddress) return [detailsLink]
      return [{ text: 'Set as current address', href: uiPaths.proposedAddresses.arrival({ crn, id }) }, detailsLink]
    default:
      return [detailsLink]
  }
}

export const flowRedirects: Record<ProposedAddressFormPage, (params: { crn: string }) => string> = {
  lookup: uiPaths.proposedAddresses.lookup,
  status: uiPaths.proposedAddresses.status,
  nextAccommodation: uiPaths.proposedAddresses.nextAccommodation,
  type: uiPaths.proposedAddresses.type,
  details: uiPaths.proposedAddresses.details,
}

export const displayStatus = (proposedAddress: ProposedAccommodationDto): ProposedAddressDisplayStatus =>
  proposedAddress.nextAccommodationStatus === 'YES' ? 'CONFIRMED' : proposedAddress.verificationStatus

export const formatProposedAddressStatus = (status?: ProposedAddressDisplayStatus): string =>
  ({
    NOT_CHECKED_YET: 'Not checked',
    FAILED: 'Failed',
    PASSED: 'Passed',
    CONFIRMED: 'Confirmed',
  })[status]

export const formatProposedAddressNextAccommodation = (status: ProposedAccommodationDto['nextAccommodationStatus']) =>
  ({
    YES: 'Yes',
    NO: 'No',
    TO_BE_DECIDED: 'Not yet',
  })[status]

export const checkYourAnswersRows = (
  sessionData: ProposedAddressFormData,
  crn: string,
  accommodationTypes: ReferenceDataDto[],
): Record<'address' | 'supportingInfo', SummaryListRow[]> => {
  const addressParts = addressLines(sessionData.address || {}, 'full')
  const changeAddressLink =
    sessionData.lookupResults || config.flags.hideManualAddressEntry
      ? uiPaths.proposedAddresses.lookup({ crn })
      : uiPaths.proposedAddresses.details({ crn })

  const rows = {
    address: [
      summaryListRowHtml('Address', addressParts.join('<br />'), [{ text: 'Change', href: changeAddressLink }]),
    ],
    supportingInfo: [
      summaryListRowHtml(
        'Living arrangement',
        accommodationTypes.find(type => type.code === sessionData.accommodationTypeCode).name,
        [{ text: 'Change', href: uiPaths.proposedAddresses.type({ crn }) }],
      ),
      summaryListRowHtml('Address checks', formatStatusWithReason(sessionData), [
        { text: 'Change', href: uiPaths.proposedAddresses.status({ crn }) },
      ]),
    ],
  }

  if (sessionData.verificationStatus === 'PASSED') {
    rows.supportingInfo.push(
      summaryListRowHtml(
        'Set as next address',
        formatProposedAddressNextAccommodation(sessionData.nextAccommodationStatus),
        [{ text: 'Change', href: uiPaths.proposedAddresses.nextAccommodation({ crn }) }],
      ),
    )
  }

  return rows
}

const formatStatusWithReason = (data: ProposedAddressFormData) => {
  const status = formatProposedAddressStatus(data.verificationStatus)
  if (data.verificationStatus === 'FAILED') {
    return toParagraphs([status, 'Not suitable'])
  }
  return status
}

export const validateLookupFromSession = (req: Request, sessionData: ProposedAddressFormData) => {
  const errors: Record<string, string> = {
    nameOrNumber:
      validateMandatoryText(sessionData.nameOrNumber, 'property name or number') ||
      validateMaxLength(sessionData.nameOrNumber, 'property name or number', 255),
    postcode: validatePostcode(sessionData.postcode),
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
  const errors: Record<string, string> = {
    addressPostcode: validatePostcode(sessionData?.address?.postcode),
  }

  return validateAndFlashErrors(req, errors)
}

export const updateTypeFromRequest = async (req: Request, formDataManager: MultiPageFormManager<'proposedAddress'>) => {
  const { accommodationTypeCode } = req.body || {}

  return formDataManager.update(req.params.crn, req.session, {
    accommodationTypeCode,
  })
}

const validateTypeFromSession = (req: Request, sessionData: ProposedAddressFormData) => {
  const errors: Record<string, string> = {
    accommodationTypeCode: validateRadioButton(sessionData?.accommodationTypeCode, 'living arrangement'),
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
  const errors: Record<string, string> = {
    verificationStatus: validateRadioButton(sessionData?.verificationStatus, 'status'),
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

  if (sessionData?.verificationStatus === 'PASSED') {
    errors.nextAccommodationStatus = validateRadioButton(
      sessionData?.nextAccommodationStatus,
      'address is confirmed',
      'whether',
    )
  }

  return validateAndFlashErrors(req, errors)
}

export const validateUpToAddress = (req: Request, sessionData: ProposedAddressFormData): string | null => {
  const { crn } = req.params

  if (!sessionData) return uiPaths.cases.show({ crn })

  const redirect =
    sessionData.lookupResults || config.flags.hideManualAddressEntry
      ? uiPaths.proposedAddresses.lookup({ crn })
      : uiPaths.proposedAddresses.details({ crn })
  return !validateAddressFromSession(req, sessionData) ? redirect : undefined
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

export const accommodationTypeItems = (
  accommodationTypes: ReferenceDataDto[],
  selectedType?: ProposedAccommodationDto['accommodationType']['code'],
) =>
  accommodationTypes.map(({ code, name }) => ({
    value: code,
    text: name,
    checked: selectedType === code,
  }))

export const verificationStatusLabels: Record<ProposedAccommodationDto['verificationStatus'], string> = {
  NOT_CHECKED_YET: 'Not checked',
  PASSED: 'Passed',
  FAILED: 'Failed',
}

export const nextAccommodationStatusLabels: Record<
  Exclude<ProposedAccommodationDto['nextAccommodationStatus'], 'NO'>,
  string
> = {
  YES: 'Yes',
  TO_BE_DECIDED: 'Not yet',
}

export const formDataToRequestBody = ({
  accommodationTypeCode,
  address,
  verificationStatus,
  nextAccommodationStatus,
}: ProposedAddressFormData): ProposedAccommodationDetailCommand => ({
  accommodationTypeCode,
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

export const addressDetailRows = (proposedAddress: ProposedAccommodationDto): SummaryListRow[] => {
  const editLink = (page: ProposedAddressFormPage): SummaryListActionItem => ({
    text: 'Change',
    href: uiPaths.proposedAddresses.edit({ crn: proposedAddress.crn, id: proposedAddress.id, page }),
  })

  return [
    summaryListRowHtml('Status', statusTag(proposedAddressStatusTag(displayStatus(proposedAddress)))),
    summaryListRowHtml('Address', formatAddress(proposedAddress.address, '<br />'), [editLink('lookup')]),
    summaryListRowText('Housing arrangement', proposedAddress.accommodationType?.description || '', [editLink('type')]),
    summaryListRowText('Address checks', formatProposedAddressStatus(proposedAddress.verificationStatus), [
      editLink('status'),
    ]),
    proposedAddress.verificationStatus === 'PASSED' &&
      summaryListRowText(
        'Next address',
        formatProposedAddressNextAccommodation(proposedAddress.nextAccommodationStatus),
        [editLink('nextAccommodation')],
      ),
  ].filter(Boolean)
}

export const nextActionButton = (proposedAddress: ProposedAccommodationDto): Button => {
  const { crn, id, verificationStatus, nextAccommodationStatus } = proposedAddress

  if (verificationStatus === 'NOT_CHECKED_YET') {
    return {
      text: 'Add checks',
      href: uiPaths.proposedAddresses.edit({ crn, id, page: 'status' }),
    }
  }
  if (verificationStatus === 'PASSED') {
    if (nextAccommodationStatus === 'YES') {
      if (config.flags.hideSetAsCurrentAddress) {
        return undefined
      }

      return {
        text: 'Set as current address',
        href: uiPaths.proposedAddresses.arrival({ crn, id }),
      }
    }

    return {
      text: 'Confirm as next address',
      href: uiPaths.proposedAddresses.edit({ crn, id, page: 'nextAccommodation' }),
    }
  }

  return undefined
}

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

const auditRecordChangesToFieldValues = (changes: FieldChange[]): AuditFieldValues =>
  Object.fromEntries(changes.map(change => [change.field, change.value]))

const fieldValuesToProposedAddress = (fieldValues: AuditFieldValues): ProposedAccommodationDto => {
  const filterFields = (predicate: (field: string) => boolean) =>
    Object.fromEntries(Object.entries(fieldValues).filter(([field]) => predicate(field)))

  return {
    ...filterFields(field => !addressFields.includes(field)),
    address: filterFields(field => addressFields.includes(field)),
    accommodationType: {
      code: '',
      description: fieldValues.accommodationTypeDescription,
    },
  } as ProposedAccommodationDto
}

export const addressTimelineEntry = (
  auditRecord: AuditRecordDto,
  previousFieldValues: AuditFieldValues = {},
): TimelineEntry => {
  const { type } = auditRecord
  if (type === 'NOTE') return noteTimelineEntry(auditRecord)

  const fieldValues = { ...previousFieldValues, ...auditRecordChangesToFieldValues(auditRecord.changes) }

  const changedFieldNames = auditRecord.changes.map(change => change.field)
  const housingArrangementChanged = changedFieldNames.includes('accommodationTypeDescription')
  const statusChanged =
    changedFieldNames.includes('verificationStatus') || changedFieldNames.includes('nextAccommodationStatus')

  const proposedAddress = fieldValuesToProposedAddress(fieldValues)
  const addressParts = addressLines(proposedAddress.address || {}, 'full')

  let label: string
  let values: Record<string, unknown>
  let status: StatusTag

  if (type === 'CREATE') {
    label = 'Address created'
    values = { Address: addressParts }
    status = proposedAddressStatusTag(displayStatus(proposedAddress))
  } else if (statusChanged) {
    label = 'Status changed'
    values = {}
    status = proposedAddressStatusTag(displayStatus(proposedAddress))
  } else if (housingArrangementChanged) {
    label = 'Living arrangement changed'
    values = { 'Housing arrangement': proposedAddress.accommodationType?.description }
  } else {
    label = 'Address changed'
    values = { Address: addressParts }
  }

  const html = renderMacro('timelineProposedAddress', { type, status, values })

  return timelineEntry(label, html, auditRecord.commitDate, auditRecord.author)
}

export const addressTimeline = (auditRecords: AuditRecordDto[]): TimelineEntry[] => {
  let fieldValues: AuditFieldValues = {}

  return [...auditRecords]
    .reverse()
    .map(auditRecord => {
      const entry = addressTimelineEntry(auditRecord, fieldValues)
      fieldValues = { ...fieldValues, ...auditRecordChangesToFieldValues(auditRecord.changes) }
      return entry
    })
    .reverse()
}

export const validateNote = (req: Request) => {
  const { note } = req.body
  const errors: Record<string, string> = {
    note: validateMandatoryText(note, 'note') || validateMaxLength(note, 'Notes', 4000),
  }

  return validateAndFlashErrors(req, errors)
}
