import { Request } from 'express'
import { OtherAccommodationReferralDto } from '@sas/api'
import { StatusCard, StatusTag } from '@sas/ui'
import { SummaryListRow } from '@govuk/ui'
import { dateFieldParts, formatDate, formatDateAndDaysAgo, isoDateToDateInput } from './dates'
import {
  validateAndFlashErrors,
  validateDateField,
  validateDateTodayOrPast,
  validateDateWithinLastXMonths,
  validateMandatoryText,
  validateMaxLength,
} from './validation'

import paths from '../paths/ui'
import { summaryListRow } from './summaryListRow'
import { statusTag } from './macros'
import { serviceStatusTag } from './statusTag'

export const validateSubmission = (req: Request) => {
  const { organisationName, referenceNumber, submissionNote } = req.body
  const submissionDateParts = dateFieldParts(req.body, 'submissionDate')
  const errors: Record<string, string> = {
    organisationName: validateMandatoryText(organisationName, 'organisation name'),
    submissionDate:
      validateDateField(submissionDateParts, 'Date', 'Year') ||
      validateDateTodayOrPast(submissionDateParts, 'Date') ||
      validateDateWithinLastXMonths(submissionDateParts, 6, 'Date'),
    referenceNumber: validateMaxLength(referenceNumber, 'reference number', 255),
    submissionNote: validateMaxLength(submissionNote, 'Notes', 4000),
  }

  return validateAndFlashErrors(req, errors, ['submissionDate'])
}

export const submissionFormValues = (referral: OtherAccommodationReferralDto | undefined): Record<string, string> => {
  if (!referral) return {}

  return {
    ...isoDateToDateInput(referral.submission?.submissionDate, 'submissionDate'),
    referenceNumber: referral.submission?.referenceNumber,
    submissionNote: referral.submission?.submissionNote,
    organisationName: referral.submission?.organisationName,
  }
}

const cardLinks = (referral: OtherAccommodationReferralDto) => {
  const { crn, submission: { id } = {} } = referral
  const url = paths.otherReferrals.show({ crn, id })
  return [{ text: 'View details', href: url, external: false }]
}

const cardStatus = (referral: OtherAccommodationReferralDto): StatusTag => {
  const { status } = referral
  const statusMap: Record<OtherAccommodationReferralDto['status'], StatusTag> = {
    SUBMITTED: { text: 'Submitted', colour: 'yellow' },
    ACCEPTED: { text: 'Accepted', colour: 'green' },
    REJECTED: { text: 'Rejected', colour: 'red' },
  }

  return statusMap[status]
}

const cardDetails = (referral: OtherAccommodationReferralDto): Array<SummaryListRow> => {
  const {
    submission: { createdByUsername, submissionDate, referenceNumber },
  } = referral

  return [
    summaryListRow('Submitted', formatDate(submissionDate)),
    summaryListRow('Submitted by', createdByUsername),
    summaryListRow('Reference', referenceNumber ?? 'no reference added'),
  ]
}

export const otherReferralCards = (referrals?: OtherAccommodationReferralDto[]): Array<StatusCard> => {
  return (referrals ?? []).map(referral => ({
    heading: referral.submission?.organisationName,
    links: cardLinks(referral),
    details: cardDetails(referral),
    status: cardStatus(referral),
  }))
}

export const detailsSummaryListRows = (referral: OtherAccommodationReferralDto = undefined) => {
  const rows = []
  const { status, submission: { submissionDate, referenceNumber, website, submissionNote } = {} } = referral || {}

  if (status === 'SUBMITTED') {
    rows.push(summaryListRow('Status', statusTag(serviceStatusTag(status)), { type: 'html' }))
  }
  rows.push(summaryListRow('Submitted on', submissionDate ? formatDateAndDaysAgo(submissionDate) : ''))
  rows.push(summaryListRow('Reference number', referenceNumber, { noValue: 'No reference added' }))
  rows.push(summaryListRow('Phone number', null, { noValue: 'No number added' }))
  rows.push(summaryListRow('Email', null, { noValue: 'No email added' }))
  rows.push(summaryListRow('Website', website, { noValue: 'No website added' }))
  rows.push(summaryListRow('Note', submissionNote, { type: 'textBlock', noValue: 'No notes added' }))
  return rows
}
