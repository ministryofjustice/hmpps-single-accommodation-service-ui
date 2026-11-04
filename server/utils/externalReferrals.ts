import { Request } from 'express'
import { RadioItem, StatusCard, StatusTag, TimelineValue } from '@sas/ui'
import { AuditRecordDto, CaseDto, ExternalReferralDto, ExternalReferralWithdrawalDto, ServiceResult } from '@sas/api'
import { SummaryListRow, TextOrHtmlContent, TimelineEntry } from '@govuk/ui'
import { dateFieldParts, formatDate, formatDateAndDaysAgo, isoDateToDateInput } from './dates'
import {
  validateAndFlashErrors,
  validateDateField,
  validateDateTodayOrPast,
  validateDateWithinLastXMonths,
  validateEmail,
  validateMandatoryText,
  validateMaxLength,
  validatePhoneNumber,
  validateUrl,
  validateRadioButton,
} from './validation'

import paths from '../paths/ui'
import { summaryListRow } from './summaryListRow'
import { renderMacro, statusTag, textBlock, textField } from './macros'
import { serviceStatusTag } from './statusTag'
import { noteTimelineEntry, timelineEntry } from './timeline'
import { staffName } from './staff'
import { htmlContent, textContent, radioItems } from './utils'
import { caseSummaryListRows } from './cases'

type FieldDefinition = {
  label: string
  format: 'text' | 'date' | 'textarea'
}

const fieldMapping: Record<string, FieldDefinition> = {
  organisationName: { label: 'Organisation', format: 'text' },
  referenceNumber: { label: 'Reference number', format: 'text' },
  submissionDate: { label: 'Submission date', format: 'date' },
  phoneNumber: { label: 'Phone number', format: 'text' },
  website: { label: 'Website', format: 'text' },
  email: { label: 'Email address', format: 'text' },
  submissionNote: { label: 'Notes', format: 'textarea' },
  outcomeNote: { label: 'Notes', format: 'textarea' },
  otherReason: { label: 'Other reason', format: 'text' },
}

export const validateSubmission = (req: Request) => {
  const { organisationName, referenceNumber, submissionNote, email, phoneNumber, website } = req.body
  const submissionDateParts = dateFieldParts(req.body, 'submissionDate')
  const errors: Record<string, string> = {
    organisationName: validateMandatoryText(organisationName, 'organisation name'),
    submissionDate:
      validateDateField(submissionDateParts, 'Date', 'Year') ||
      validateDateTodayOrPast(submissionDateParts, 'Date') ||
      validateDateWithinLastXMonths(submissionDateParts, 6, 'Date'),
    referenceNumber: validateMaxLength(referenceNumber, 'Reference number', 255),
    submissionNote: validateMaxLength(submissionNote, 'Notes', 4000),
    email: validateEmail(email),
    phoneNumber: validatePhoneNumber(phoneNumber),
    website: validateUrl(website),
  }

  return validateAndFlashErrors(req, errors, ['submissionDate'])
}

export const validateNote = (req: Request) => {
  const { note } = req.body
  const errors: Record<string, string> = {
    note: validateMandatoryText(note, 'note') || validateMaxLength(note, 'Notes', 4000),
  }

  return validateAndFlashErrors(req, errors)
}

export const submissionFormValues = (referral: ExternalReferralDto | undefined): Record<string, string> => {
  if (!referral) return {}
  const {
    submission: { submissionDate, referenceNumber, website, phoneNumber, email, submissionNote, organisationName } = {},
  } = referral
  return {
    ...isoDateToDateInput(submissionDate, 'submissionDate'),
    referenceNumber,
    submissionNote,
    organisationName,
    website,
    phoneNumber,
    email,
  }
}

const cardLinks = (referral: ExternalReferralDto) => {
  const { crn, submission: { id } = {} } = referral
  const url = paths.externalReferrals.show({ crn, id })
  return [{ text: 'View details', href: url, external: false }]
}

const cardDetails = (referral: ExternalReferralDto): Array<SummaryListRow> => {
  const {
    submission: { createdBy, submissionDate, referenceNumber },
  } = referral

  return [
    summaryListRow('Reference', referenceNumber || 'No reference added'),
    summaryListRow('Submitted', formatDateAndDaysAgo(submissionDate)),
    summaryListRow('Submitted by', createdBy),
  ]
}

const externalReferralStatusTags: Record<string, StatusTag> = {
  SUBMITTED: { text: 'Submitted', colour: 'yellow' },
  REJECTED: { text: 'Rejected', colour: 'orange' },
  ACCEPTED: { text: 'Accepted', colour: 'green' },
  COMPLETED: { text: 'Completed', colour: 'green' },
  ARCHIVED: { text: 'Archived', colour: 'grey' },
} satisfies Record<ExternalReferralDto['status'], StatusTag>

export const externalReferralStatusTag = (status?: string): StatusTag =>
  status && Object.prototype.hasOwnProperty.call(externalReferralStatusTags, status)
    ? externalReferralStatusTags[status]
    : { text: 'Unknown' }

export const externalReferralCards = (referrals?: ExternalReferralDto[]): Array<StatusCard> => {
  return (referrals ?? []).map(referral => ({
    heading: referral.submission?.organisationName,
    links: cardLinks(referral),
    details: cardDetails(referral),
    status: externalReferralStatusTag(referral.status),
  }))
}

export const detailsSummaryListRows = (referral: ExternalReferralDto = undefined) => {
  const rows = []
  const { status, submission: { submissionDate, referenceNumber, website, phoneNumber, email, submissionNote } = {} } =
    referral || {}

  if (status === 'SUBMITTED') {
    rows.push(summaryListRow('Status', statusTag(externalReferralStatusTag(status)), { type: 'html' }))
  }
  rows.push(summaryListRow('Submitted on', submissionDate ? formatDateAndDaysAgo(submissionDate) : ''))
  rows.push(summaryListRow('Reference number', referenceNumber, { noValue: 'No reference added' }))
  rows.push(summaryListRow('Phone number', phoneNumber, { noValue: 'No number added' }))
  rows.push(summaryListRow('Email', email, { noValue: 'No email added' }))
  rows.push(summaryListRow('Website', website, { noValue: 'No website added' }))
  rows.push(summaryListRow('Notes', submissionNote, { type: 'textBlock', noValue: 'No notes added' }))
  return rows
}

export const withdrawalReasonLabels: Record<ExternalReferralWithdrawalDto['withdrawalReason'], string> = {
  ANOTHER_ACCOMMODATION_FOUND: 'Another accommodation option found',
  NO_CAPACITY: 'No capacity',
  PLACEMENT_COMPLETE: 'Placement complete',
  NO_RESPONSE_FROM_ORGANISATION: 'No response from organisation',
  PERSON_CANNOT_BE_CONTACTED_OR_DISENGAGED: 'Person can no longer be contacted or has disengaged',
  PERSON_NOT_SUITABLE: 'Person not suitable',
  PERSON_NO_LONGER_CONSENTS: 'Person no longer consents',
  ANOTHER_REASON: 'Other',
}

const withdrawalTimelineReasonLabels = {
  ...withdrawalReasonLabels,
  PLACEMENT_COMPLETE: 'Completed stay',
}

// Audit records omit unchanged status, so use the API's reason-to-status mapping.
const withdrawalStatusByReason: Record<
  ExternalReferralWithdrawalDto['withdrawalReason'],
  ExternalReferralDto['status']
> = {
  PLACEMENT_COMPLETE: 'COMPLETED',
  ANOTHER_ACCOMMODATION_FOUND: 'ARCHIVED',
  NO_RESPONSE_FROM_ORGANISATION: 'ARCHIVED',
  PERSON_CANNOT_BE_CONTACTED_OR_DISENGAGED: 'ARCHIVED',
  PERSON_NO_LONGER_CONSENTS: 'ARCHIVED',
  PERSON_NOT_SUITABLE: 'REJECTED',
  NO_CAPACITY: 'REJECTED',
  ANOTHER_REASON: 'ARCHIVED',
}

const isWithdrawalReason = (reason: string): reason is ExternalReferralWithdrawalDto['withdrawalReason'] =>
  Object.prototype.hasOwnProperty.call(withdrawalTimelineReasonLabels, reason)

export const externalReferralTimelineEntry = (auditRecord: AuditRecordDto, currentUsername?: string): TimelineEntry => {
  const { type, changes } = auditRecord

  if (type === 'NOTE') return noteTimelineEntry(auditRecord, currentUsername)

  const fieldChange = (fieldName: string) => changes.find(({ field }) => field === fieldName)
  const { value: newStatus, oldValue: oldStatus } = fieldChange('status') || {}
  const withdrawalReason = fieldChange('withdrawalReason')?.value
  const isWithdrawal = type === 'UPDATE' && (withdrawalReason || newStatus === 'COMPLETED' || newStatus === 'ARCHIVED')

  if (isWithdrawal) {
    const knownReason = withdrawalReason && isWithdrawalReason(withdrawalReason) ? withdrawalReason : undefined
    const status = newStatus || (knownReason && withdrawalStatusByReason[knownReason])
    const otherReason = fieldChange('otherReason')?.value
    const withdrawalNote = fieldChange('withdrawalNote')?.value
    const values: TimelineValue[] = [
      ...(withdrawalReason
        ? [
            {
              label: 'Reason',
              value: textContent(knownReason ? withdrawalTimelineReasonLabels[knownReason] : withdrawalReason),
            },
          ]
        : []),
      ...(otherReason ? [{ label: 'Other reason', value: textContent(otherReason) }] : []),
      ...(withdrawalNote ? [{ label: 'Notes', value: htmlContent(textBlock(withdrawalNote)) }] : []),
    ]

    const html = renderMacro('timelineEntry', {
      status: status ? externalReferralStatusTag(status) : undefined,
      values,
      isChange: false,
    })

    return timelineEntry(
      'Moved to referral history',
      html,
      auditRecord.commitDate,
      staffName(auditRecord.authorDetails, currentUsername),
    )
  }

  const changeValues = changes
    .map(({ field, value }) => {
      const def = fieldMapping[field]
      if (!def) return undefined
      if (!value) return type === 'UPDATE' ? { value: textContent(`${fieldMapping[field].label} removed`) } : undefined

      let content: TextOrHtmlContent = textContent(value)
      if (def.format === 'date') content = textContent(formatDate(value))
      if (def.format === 'textarea') content = htmlContent(textBlock(value))

      return { label: def.label, value: content }
    })
    .filter(Boolean)

  const isOutcome = (newStatus && newStatus !== 'SUBMITTED') || fieldChange('outcomeNote')
  const isChange = isOutcome ? !newStatus || oldStatus !== 'SUBMITTED' : type === 'UPDATE'
  const label = `${isOutcome ? 'Outcome' : 'Referral'} details ${isChange ? 'changed' : 'added'}`

  const html = renderMacro('timelineEntry', {
    type,
    status: newStatus ? externalReferralStatusTag(newStatus) : undefined,
    values: changeValues,
    isChange,
  })

  return timelineEntry(label, html, auditRecord.commitDate, staffName(auditRecord.authorDetails, currentUsername))
}

export const outcomeReasonLabels: Partial<Record<ExternalReferralDto['status'], string>> = {
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
}

export const summaryListRows = (caseData: CaseDto, referral?: ExternalReferralDto, includeStatus = false) => {
  const rows = caseSummaryListRows(caseData)
  if (referral) {
    rows.push(summaryListRow('Organisation', referral.submission.organisationName))
    rows.push(summaryListRow('Date submitted', formatDateAndDaysAgo(referral.submission.submissionDate)))
    if (includeStatus) {
      rows.push(
        summaryListRow('Status', statusTag(serviceStatusTag(referral.status as ServiceResult['serviceStatus'])), {
          type: 'html',
        }),
      )
    }
  }

  return rows
}

export const outcomeRadioItems = (outcomeReason: ExternalReferralDto['status']): Array<RadioItem> => {
  const html = "<p class='govuk-body'>Once you have address details, add them as a 'Proposed address'.</p>"
  return radioItems(outcomeReasonLabels, outcomeReason).map(item =>
    item.value === 'ACCEPTED' ? { ...item, conditional: { html } } : item,
  )
}

export const validateOutcome = (req: Request) => {
  const { outcomeStatus, outcomeNote } = req.body
  const errors: Record<string, string> = {
    outcomeStatus: validateRadioButton(outcomeStatus, 'external referral status'),
    outcomeNote: validateMaxLength(outcomeNote, fieldMapping.outcomeNote.label, 4000),
  }

  return validateAndFlashErrors(req, errors)
}

export const outcomeDetailsSummaryListRows = (referral: ExternalReferralDto) => {
  const { status, submission: { outcomeNote } = {} } = referral
  if (status === 'SUBMITTED') {
    return []
  }

  return [
    summaryListRow('Status', statusTag(serviceStatusTag(status as ServiceResult['serviceStatus'])), { type: 'html' }),
    summaryListRow(fieldMapping.outcomeNote.label, outcomeNote, { type: 'textBlock', noValue: 'No details added' }),
  ]
}

export const withdrawalReasonRadios = (
  withdrawalReason: ExternalReferralWithdrawalDto['withdrawalReason'],
  context: Record<string, unknown>,
): Array<RadioItem> => {
  const html = textField('otherReason', 'Reason', context)
  return radioItems(withdrawalReasonLabels, withdrawalReason).map((radioItem: RadioItem) => {
    if (radioItem.value === 'ANOTHER_REASON') {
      return { ...radioItem, conditional: { html } }
    }
    return radioItem
  })
}

export const validateWithdrawal = (req: Request) => {
  const { withdrawalReason, otherReason } = req.body
  const errors: Record<string, string> = {
    withdrawalReason: validateRadioButton(withdrawalReason, 'reason for moving to the referral history'),
    otherReason:
      withdrawalReason === 'ANOTHER_REASON'
        ? validateMandatoryText(otherReason, 'reason') || validateMaxLength(otherReason, 'reason', 100)
        : undefined,
  }

  return validateAndFlashErrors(req, errors)
}
