import { StatusCard, StatusTag } from '@sas/ui'
import { AccommodationDetail } from '@sas/api'
import { formatDateAndDaysAgo } from './dates'
import { arrangementSubTypes, summaryListRow } from './cases'
import { formatAddress } from './addresses'

const proposedAddressStatusTag = (status: AccommodationDetail['status']): StatusTag =>
  ({
    NOT_CHECKED_YET: { text: 'Not checked', colour: 'red' },
    CHECKS_FAILED: { text: 'Checks failed' },
    CHECKS_PASSED: { text: 'Checks passed', colour: 'yellow' },
    CONFIRMED: { text: 'Confirmed', colour: 'green' },
  })[status]

// eslint-disable-next-line import/prefer-default-export
export const proposedAddressStatusCard = (proposedAddress: AccommodationDetail): StatusCard => ({
  heading: formatAddress(proposedAddress.address),
  inactive: proposedAddress.status === 'CHECKS_FAILED',
  status: proposedAddressStatusTag(proposedAddress.status),
  details: [
    summaryListRow('Housing arrangement', arrangementLabel(proposedAddress)),
    summaryListRow('Added by', ''),
    summaryListRow('Date added', formatDateAndDaysAgo(proposedAddress.createdAt)),
  ],
  links: linksForStatus(proposedAddress.status),
})

const linksForStatus = (status: AccommodationDetail['status']) => {
  switch (status) {
    case 'CHECKS_PASSED':
      return [
        { text: 'Confirm as next address', href: '#' },
        { text: 'Notes', href: '#' },
      ]
    case 'NOT_CHECKED_YET':
      return [
        { text: 'Add checks', href: '#' },
        { text: 'Notes', href: '#' },
      ]
    default:
      return [{ text: 'Notes', href: '#' }]
  }
}

const settledTypes: Record<AccommodationDetail['settledType'], string> = {
  SETTLED: 'Settled',
  TRANSIENT: 'Transient',
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
