import { DtrSubmissionDto, AccommodationReferralDto as Referral } from '@sas/api'
import { StatusCell, StatusTag } from '@sas/ui'
import { TableRow, TextOrHtmlContent } from '@govuk/ui'
import { linksCell, tableTextCell } from './tables'
import { renderMacro, statusCell } from './macros'
import { htmlContent, textContent } from './utils'
import { outcomeReasonSummaryLabels, withdrawReasonLabels } from './dutyToRefer'
import { formatDate } from './dates'
import uiPaths from '../paths/ui'

export const referralStatusType = (type?: Referral['type'], status?: string): string => {
  switch (type) {
    case 'CAS1':
      switch (status) {
        case 'REQUEST_REJECTED':
        case 'REQUEST_WITHDRAWN':
          return 'Approved Premises (CAS1) placement request'
        case 'NOT_ARRIVED':
        case 'DEPARTED':
        case 'CANCELLED':
          return 'Approved Premises (CAS1) placement'
        default:
          return 'Approved Premises (CAS1) application'
      }
    case 'CAS3':
      switch (status) {
        case 'DEPARTED':
        case 'CANCELLED':
          return 'CAS3 booking'
        default:
          return 'CAS3 referral'
      }
    case 'DTR':
      return 'Duty to refer'
    default:
      return 'Unknown'
  }
}

export const referralStatusTag = (status?: string, type?: Referral['type']): StatusTag =>
  ({
    REQUEST_WITHDRAWN: { text: 'Request withdrawn', colour: 'grey' },
    EXPIRED: { text: 'Expired', colour: 'grey' },
    REJECTED:
      type === 'DTR'
        ? { text: 'Not accepted', colour: 'grey' }
        : { text: type === 'CAS1' ? 'Application rejected' : 'Rejected', colour: 'orange' },
    REQUEST_REJECTED: { text: 'Request rejected', colour: 'orange' },
    ACCEPTED: { text: 'Accepted', colour: 'green' },
    PENDING: { text: 'Pending', colour: 'orange' },
    NOT_ARRIVED: { text: 'Not arrived', colour: 'orange' },
    DEPARTED: { text: 'Departed', colour: 'green' },
    CANCELLED: { text: 'Cancelled', colour: 'orange' },
    ARCHIVED: { text: 'Archived', colour: 'grey' },
    WITHDRAWN: { text: type === 'CAS1' ? 'Application withdrawn' : 'Withdrawn', colour: 'grey' },
  })[status] || { text: 'Unknown' }

export const referralHistoryRows = (referrals?: Referral[], username?: string, crn?: string): TableRow[] => {
  return (referrals ?? []).map(referral => {
    const status = getReferralStatus(referral)

    return [
      htmlContent(tableTextCell('Referral type', referralStatusType(referral.type, status))),
      htmlContent(tableTextCell('Referred by', referralReferredBy(referral, username))),
      htmlContent(statusCell(referralStatusCell(referral))),
      htmlContent(linksCell(referralLinksForType(referral.type, referral.id, crn, referral.uiUrl))),
    ]
  })
}

export const referralStatusCell = (referral: Referral): StatusCell => {
  const status = getReferralStatus(referral)

  if (referral.type === 'DTR') {
    return {
      status: referralStatusTag(status, referral.type),
      dateText: `Submitted on ${formatDate(referral.date)}`,
      details: getDtrReferralDetails(referral),
    }
  }

  return {
    status: referralStatusTag(status, referral.type),
    dateText: formatDate(referral.date),
    details: referral.type === 'CAS1' ? getCas1ReferralDetails(referral, status) : getCas3ReferralDetails(referral, status),
  }
}

const REASON_DETAIL_MAX_LENGTH = 200

const reasonDetailContent = (reason: string): TextOrHtmlContent =>
  reason.length > REASON_DETAIL_MAX_LENGTH
    ? htmlContent(renderMacro('govukDetails', { summaryText: 'Reason details', text: reason }))
    : textContent(`Reason details: ${reason}`)

const getDtrReferralDetails = (referral: Referral): Array<TextOrHtmlContent> => {
  const details: Array<TextOrHtmlContent> = []

  if (referral.localAuthorityArea) {
    details.push(textContent(`Local authority: ${referral.localAuthorityArea}`))
  }

  if (referral.placementStatus) {
    const reasonText =
      referral.placementStatus === 'WITHDRAWN'
        ? withdrawReasonLabels[referral.referralRejectionReason as DtrSubmissionDto['withdrawalReason']]
        : outcomeReasonSummaryLabels[referral.placementStatus as DtrSubmissionDto['outcomeReason']]

    if (reasonText) {
      details.push(textContent(`Reason: ${reasonText}`))
    }
  }

  return details
}

const getCas1ReferralDetails = (referral: Referral, status?: string): Array<TextOrHtmlContent> => {
  const details: Array<TextOrHtmlContent> = []

  const applicationStatuses = ['REJECTED', 'EXPIRED', 'WITHDRAWN']
  const placementStatuses = ['NOT_ARRIVED', 'DEPARTED', 'CANCELLED']

  if (applicationStatuses.includes(status)) {
    details.push(textContent('No placements'))
  }

  if (referral.referralRejectionReason) {
    details.push(textContent(`Reason: ${referral.referralRejectionReason}`))
  }

  if (referral.referralRejectionReasonDetail) {
    details.push(reasonDetailContent(referral.referralRejectionReasonDetail))
  }

  if (referral.placementAddress && placementStatuses.includes(status)) {
    details.push(textContent(referral.placementAddress))
  }

  return details
}

const getCas3ReferralDetails = (referral: Referral, status?: string): Array<TextOrHtmlContent> => {
  const details: Array<TextOrHtmlContent> = []
  const bookingStatuses = ['DEPARTED', 'CANCELLED']

  if (referral.referralRejectionReasonDetail) {
    details.push(reasonDetailContent(referral.referralRejectionReasonDetail))
  }

  if (status === 'ARCHIVED') {
    details.push(textContent('No bookings'))
  }

  if (bookingStatuses.includes(status)) {
    if (referral.placementAddress) {
      details.push(textContent(referral.placementAddress))
    }
    if (referral.pdu) {
      details.push(textContent(`PDU: ${referral.pdu}`))
    }
  }

  return details
}

export const referralHistoryTable = (
  referrals: Referral[],
  username?: string,
  crn?: string,
  hasApiError?: boolean,
): string => renderMacro('referralHistoryTable', { rows: referralHistoryRows(referrals, username, crn), hasApiError })

export const referralReferredBy = (c: Referral, username?: string): string => {
  const fullName = c.referredBy?.name ?? 'Unknown'
  return c.referredBy?.username?.toUpperCase() === username?.toUpperCase() ? `You (${fullName})` : fullName
}

export const referralLinksForType = (type: Referral['type'], id: string, crn: string, url?: string) => {
  switch (type) {
    case 'DTR':
      return [{ text: 'View referral', href: uiPaths.dutyToRefer.show({ crn, id }) }]
    case 'CAS1':
      return [
        {
          text: 'View application',
          href: url,
        },
      ]
    case 'CAS3':
      return [{ text: 'View referral', href: url }]
    default:
      return []
  }
}

export const getReferralStatus = (referral: Referral): string | undefined => {
  if (referral.type === 'DTR') {
    return referral.status
  }

  const placementStatus = referral.placementStatus?.toUpperCase()
  if (referral.type === 'CAS1') {
    return placementStatus || referral.status
  }

  if (referral.status === 'REJECTED') {
    if (referral.referralRejectionReason) {
      return 'REJECTED'
    } else {
      return 'ARCHIVED'
    }
  }

  return placementStatus
}
