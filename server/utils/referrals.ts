import { AccommodationReferralDto as Referral } from '@sas/api'
import { StatusCell, StatusTag } from '@sas/ui'
import { TableRow, TextOrHtmlContent } from '@govuk/ui'
import { linksCell } from './tables'
import { renderMacro, statusCell } from './macros'
import { htmlContent, textContent } from './utils'

export const referralStatusType = (type?: Referral['type'], status?: Referral['status']): string => {
  if (type === 'CAS1') {
    if (['REQUEST_REJECTED', 'REQUEST_WITHDRAW'].includes(status)) {
      return 'Approved Premises (CAS1) placement request'
    }
    if (['NOT_ARRIVED', 'DEPARTED', 'CANCELLED'].includes(status)) {
      return 'Approved Premises (CAS1) placement'
    }
    return 'Approved Premises (CAS1) application'
  }
  if (type === 'CAS3') {
    if (['REJECTED', 'ARCHIVED'].includes(status)) {
      return 'CAS3 referral'
    }
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
  return 'Unknown'
}

export const referralStatusTag = (status?: Referral['status'], type?: Referral['type']): StatusTag => {
  if (status === 'REJECTED' && type === 'CAS1') {
    return { text: 'Application rejected', colour: 'orange' }
  }
  return (
    {
      REQUEST_WITHDRAW: { text: 'Request withdrawn', colour: 'grey' },
      WITHDRAW: { text: 'Application withdrawn', colour: 'grey' },
      EXPIRED: { text: 'Expired', colour: 'grey' },
      REJECTED: { text: 'Rejected', colour: 'orange' },
      REQUEST_REJECTED: { text: 'Request rejected', colour: 'orange' },
      ACCEPTED: { text: 'Accepted', colour: 'green' },
      NOT_ARRIVED: { text: 'Not arrived', colour: 'orange' },
      DEPARTED: { text: 'Departed', colour: 'green' },
      CANCELLED: { text: 'Cancelled', colour: 'orange' },
      ARCHIVED: { text: 'Archived', colour: 'grey' },
      WITHDRAWN: { text: 'Withdrawn' },
  }[status] || { text: 'Unknown' }
  )
}

export const referralHistoryRows = (referrals?: Referral[], username?: string): TableRow[] => {
  return (referrals ?? []).map(referral => [
    textContent(referralStatusType(referral.type, referral.status)),
    textContent(referralReferredBy(referral, username)),
    htmlContent(statusCell(referralStatusCell(referral))),
    htmlContent(linksCell(referralLinksForType(referral.type))),
  ])
}

export const referralStatusCell = (referral: Referral): StatusCell => {
  return {
    status: referralStatusTag(referral.status, referral.type),
    date: referral.createdAt,
    details: getReferralDetails(referral),
  }
}

const getReferralDetails = (referral: Referral): Array<TextOrHtmlContent> => {
  const details: Array<TextOrHtmlContent> = []

  const placementStatuses = ['REJECTED', 'EXPIRED', 'WITHDRAW']
  if (placementStatuses.includes(referral.status) && referral.type === 'CAS1') {
    details.push(textContent('No placements'))
  }

  const bookingStatuses = ['ARCHIVED']
  if (bookingStatuses.includes(referral.status) && referral.type === 'CAS3') {
    details.push(textContent('No bookings'))
  }

  if (referral.referralRejectionReason) {
    details.push(textContent(`Reason: ${referral.referralRejectionReason}`))
  }

  if (referral.referralRejectionDetails) {
    const reason = referral.referralRejectionDetails

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

  if (referral.localAuthorityArea) {
    details.push(textContent(`Local authority area: ${referral.localAuthorityArea}`))
  }

  if (referral.placementAddress) {
    details.push(textContent(referral.placementAddress))
  }

  if (referral.pdu) {
    details.push(textContent(`PDU: ${referral.pdu}`))
  }

  if (referral.placementStatus) {
    details.push(textContent(referral.placementStatus))
  }

  return details
}

export const referralHistoryTable = (referrals: Referral[], username?: string, hasApiError?: boolean): string =>
  renderMacro('referralHistoryTable', { rows: referralHistoryRows(referrals, username), hasApiError })

export const referralReferredBy = (c: Referral, username: string): string => {
  const fullName = `${c.referredBy?.forename} ${c.referredBy?.surname}`
  return String(c.referredBy?.username) === username ? `You (${fullName})` : fullName
}

export const referralLinksForType = (type: Referral['type']) => {
  switch (type) {
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
