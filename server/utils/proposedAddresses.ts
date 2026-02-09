import { StatusCard } from '@sas/ui'
import { AccommodationDetail } from '@sas/api'
import {
  formatAddress,
  formatDateAndDaysAgo,
  formatProposedAddressStatus,
  proposedAddressStatusColours,
} from './format'
import { arrangementSubTypes, summaryListRow } from './cases'

// eslint-disable-next-line import/prefer-default-export
export const proposedAddressStatusCard = (proposedAddress: AccommodationDetail): StatusCard => ({
  heading: formatAddress(proposedAddress.address),
  inactive: proposedAddress.verificationStatus === 'FAILED',
  status: {
    text: formatProposedAddressStatus(proposedAddress.verificationStatus),
    colour: proposedAddressStatusColours[proposedAddress.verificationStatus],
  },
  details: [
    summaryListRow('Housing arrangement', arrangementLabel(proposedAddress)),
    summaryListRow('Added by', ''),
    summaryListRow('Date added', formatDateAndDaysAgo(proposedAddress.createdAt)),
  ],
  links: linksForStatus(proposedAddress.verificationStatus),
})

const linksForStatus = (status: AccommodationDetail['verificationStatus']) => {
  switch (status) {
    case 'PASSED':
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
