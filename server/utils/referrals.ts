import { AccommodationReferralDto as Referral } from '@sas/api'
import { StatusTag } from '@sas/ui'
import { TableRow } from '@govuk/ui'
import { dateCell, htmlCell, linksCell, textCell } from './tables'
import { renderMacro, statusTag } from './macros'

export const referralStatusType = (type?: Referral['type']): string =>
  ({
    CAS1: 'Approved premises',
    CAS2: 'CAS2 for HDC',
    CAS2v2: 'CAS2 for Bail',
    CAS3: 'CAS3',
  })[type] || 'Unknown'

export const referralStatusTag = (status?: Referral['status']): StatusTag =>
  ({
    PENDING: { text: 'Pending', colour: 'yellow' },
    ACCEPTED: { text: 'Accepted', colour: 'green' },
    REJECTED: { text: 'Rejected', colour: 'red' },
  })[status] || { text: 'Unknown' }

export const referralHistoryRows = (referrals: Referral[]): TableRow[] => {
  return referrals.map(referral => [
    textCell(referralStatusType(referral.type)),
    htmlCell(statusTag(referralStatusTag(referral.status))),
    dateCell(referral.date),
    htmlCell(linksCell([{ text: 'View', href: '#' }])),
  ])
}

export const referralHistoryTable = (referrals: Referral[]): string =>
  renderMacro('referralHistoryTable', {
    referralHistory: referralHistoryRows(referrals),
  })
