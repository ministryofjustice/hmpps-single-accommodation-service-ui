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
  return (referrals ?? []).map(referral => [
    htmlContent(
      tableTextCell(
        'Referral type',
        referralStatusType(referral.type, referral.type === 'DTR' ? referral.status : referral.placementStatus),
      ),
    ),
    htmlContent(tableTextCell('Referred by', referralReferredBy(referral, username))),
    htmlContent(statusCell(referralStatusCell(referral))),
    htmlContent(linksCell(referralLinksForType(referral.type, referral.id, crn))),
  ])
}

export const referralStatusCell = (referral: Referral): StatusCell => {
  if (referral.type === 'DTR') {
    return {
      status: referralStatusTag(referral.status, referral.type),
      dateText: `Submitted on ${formatDate(referral.date)}`,
      details: getDtrReferralDetails(referral),
    }
  }

  return {
    status: referralStatusTag(referral.placementStatus, referral.type),
    dateText: formatDate(referral.date),
    details: getCasReferralDetails(referral),
  }
}

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

const getCasReferralDetails = (referral: Referral): Array<TextOrHtmlContent> => {
  const details: Array<TextOrHtmlContent> = []

  const applicationStatuses = ['REJECTED', 'EXPIRED', 'WITHDRAWN']
  if (applicationStatuses.includes(referral.placementStatus) && referral.type === 'CAS1') {
    details.push(textContent('No placements'))
  }

  const bookingStatuses = ['ARCHIVED']
  if (bookingStatuses.includes(referral.placementStatus) && referral.type === 'CAS3') {
    details.push(textContent('No bookings'))
  }

  if (referral.referralRejectionReason) {
    details.push(textContent(`Reason: ${referral.referralRejectionReason}`))
  }

  if (referral.referralRejectionReasonDetail) {
    const reason = referral.referralRejectionReasonDetail

    if (reason.length > 200) {
      details.push(
        htmlContent(
          renderMacro('govukDetails', {
            summaryText: 'Reason details',
            text: reason,
          }),
        ),
      )
    } else {
      details.push(textContent(`Reason details: ${reason}`))
    }
  }

  if (referral.placementAddress) {
    details.push(textContent(referral.placementAddress))
  }

  if (referral.pdu) {
    details.push(textContent(`PDU: ${referral.pdu}`))
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

export const referralLinksForType = (type: Referral['type'], id: string, crn: string) => {
  switch (type) {
    case 'DTR':
      return [{ text: 'View referral', href: uiPaths.dutyToRefer.show({ crn, id }) }]
    case 'CAS1':
      return [
        {
          text: 'View application',
          href: '#',
        },
      ]
    case 'CAS3':
      return [{ text: 'View referral', href: '#' }]
    default:
      return []
  }
}
