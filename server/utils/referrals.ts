import { DtrSubmissionDto, AccommodationReferralDto as Referral } from '@sas/api'
import { StatusCell, StatusTag } from '@sas/ui'
import { TableRow, TextOrHtmlContent } from '@govuk/ui'
import { linksCell } from './tables'
import { renderMacro, statusCell } from './macros'
import { htmlContent, textContent } from './utils'
import { outcomeReasonSummaryLabels, withdrawReasonLabels } from './dutyToRefer'
import { formatDate } from './dates'
import uiPaths from '../paths/ui'

export const referralStatusType = (type?: Referral['type'], status?: string): string => {
  if (type === 'CAS1') {
    if (['REQUEST_REJECTED', 'REQUEST_WITHDRAWN'].includes(status)) {
      return 'Approved Premises (CAS1) placement request'
    }
    if (['NOT_ARRIVED', 'DEPARTED', 'CANCELLED'].includes(status)) {
      return 'Approved Premises (CAS1) placement'
    }
    return 'Approved Premises (CAS1) application'
  }
  if (type === 'CAS3') {
    if (['DEPARTED', 'CANCELLED'].includes(status)) {
      return 'CAS3 booking'
    }
    return 'CAS3 referral'
  }
  if (type === 'CAS2HDC') {
    return 'CAS2 for HDC'
  }
  if (type === 'CAS2') {
    return 'CAS2 for Bail'
  }
  if (type === 'DTR') {
    return 'Duty to refer'
  }
  return 'Unknown'
}

export const referralStatusTag = (status?: string, type?: Referral['type']): StatusTag => {
  if (type === 'CAS1') {
    if (['REJECTED', 'WITHDRAWN'].includes(status)) {
      return {
        REJECTED: { text: 'Application rejected', colour: 'orange' },
        WITHDRAWN: { text: 'Application withdrawn', colour: 'grey' },
      }[status]
    }
  }
  if (status === 'REJECTED' && type === 'DTR') {
    return { text: 'Not accepted', colour: 'grey' }
  }
  return (
    {
      REQUEST_WITHDRAWN: { text: 'Request withdrawn', colour: 'grey' },
      EXPIRED: { text: 'Expired', colour: 'grey' },
      REJECTED: { text: 'Rejected', colour: 'orange' },
      REQUEST_REJECTED: { text: 'Request rejected', colour: 'orange' },
      ACCEPTED: { text: 'Accepted', colour: 'green' },
      PENDING: { text: 'Pending', colour: 'orange' },
      NOT_ARRIVED: { text: 'Not arrived', colour: 'orange' },
      DEPARTED: { text: 'Departed', colour: 'green' },
      CANCELLED: { text: 'Cancelled', colour: 'orange' },
      ARCHIVED: { text: 'Archived', colour: 'grey' },
      WITHDRAWN: { text: 'Withdrawn', colour: 'grey' },
    }[status] || { text: 'Unknown' }
  )
}

export const referralHistoryRows = (referrals?: Referral[], username?: string, crn?: string): TableRow[] => {
  return (referrals ?? []).map(referral => [
    textContent(
      referralStatusType(referral.type, referral.type === 'DTR' ? referral.status : referral.placementStatus),
    ),
    textContent(referralReferredBy(referral, username)),
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
    date: referral.date,
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
          renderMacro('details', {
            summary: 'Reason details',
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
