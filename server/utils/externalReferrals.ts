import { Request } from 'express'
import { AuditRecordDto, ExternalReferralDto, FieldChange, ServiceResult } from '@sas/api'
import { StatusCard, StatusTag } from '@sas/ui'
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
} from './validation'

import paths from '../paths/ui'
import { summaryListRow } from './summaryListRow'
import { renderMacro, statusTag, textBlock } from './macros'
import { serviceStatusTag } from './statusTag'
import { timelineEntry } from './timeline'
import { staffName } from './staff'
import { htmlContent, textContent } from './utils'

type FieldDefinition = {
  label: string
  format: 'text' | 'date' | 'textarea'
}

const fieldMapping: Record<string, FieldDefinition> = {
  referenceNumber: { label: 'Reference number', format: 'text' },
  submissionDate: { label: 'Submission date', format: 'date' },
  phoneNumber: { label: 'Phone number', format: 'text' },
  website: { label: 'Website', format: 'text' },
  email: { label: 'Email address', format: 'text' },
  organisationName: { label: 'Organisation', format: 'text' },
  submissionNote: { label: 'Submission note', format: 'textarea' },
}

export const validateSubmission = (req: Request) => {
  const { organisationName, referenceNumber, submissionNote, email, phoneNumber } = req.body
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
  }

  return validateAndFlashErrors(req, errors, ['submissionDate'])
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
    summaryListRow('Submitted', formatDateAndDaysAgo(submissionDate)),
    summaryListRow('Submitted by', createdBy),
    summaryListRow('Reference', referenceNumber ?? 'no reference added'),
  ]
}

export const externalReferralStatusTag = (status?: ExternalReferralDto['status']): StatusTag =>
  ({
    SUBMITTED: { text: 'Submitted', colour: 'yellow' },
    REJECTED: { text: 'Rejected', colour: 'orange' },
    ACCEPTED: { text: 'Accepted', colour: 'green' },
    COMPLETED: { text: 'Completed', colour: 'green' },
    ARCHIVED: { text: 'Archived', colour: 'grey' },
  })[status] || { text: 'Unknown' }

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
  rows.push(summaryListRow('Note', submissionNote, { type: 'textBlock', noValue: 'No notes added' }))
  return rows
}

export const externalReferralTimelineEntry = (auditRecord: AuditRecordDto, currentUsername?: string): TimelineEntry => {
  const { type, changes } = auditRecord

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

  const flatChanges = changes.reduce(
    (acc, change) => {
      acc[change.field] = change
      return acc
    },
    {} as Record<string, FieldChange>,
  )

  const statusChange = flatChanges.status?.value as unknown as ServiceResult['serviceStatus']
  const isChange = type === 'UPDATE'
  const label = isChange ? 'Referral details changed' : 'Referral details added'

  const html = renderMacro('timelineEntry', {
    type,
    status: statusChange ? serviceStatusTag(statusChange) : undefined,
    values: changeValues,
    isChange,
  })

  return timelineEntry(label, html, auditRecord.commitDate, staffName(auditRecord.authorDetails, currentUsername))
}
