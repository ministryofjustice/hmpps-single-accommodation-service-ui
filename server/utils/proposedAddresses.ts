import { StatusCard } from '@sas/ui'
import { ProposedAddressDto } from '../testutils/factories/proposedAddress'
import {
  formatAddress,
  formatDateAndDaysAgo,
  formatProposedAddressStatus,
  proposedAddressStatusColours,
} from './format'
import { summaryListRow } from './cases'

// eslint-disable-next-line import/prefer-default-export
export const proposedAddressStatusCard = (proposedAddress: ProposedAddressDto): StatusCard => ({
  heading: formatAddress(proposedAddress.address),
  inactive: proposedAddress.status === 'FAILED',
  status: {
    text: formatProposedAddressStatus(proposedAddress.status),
    colour: proposedAddressStatusColours[proposedAddress.status],
  },
  details: [
    summaryListRow('Housing arrangement', ''),
    summaryListRow('Added by', ''),
    summaryListRow('Date added', formatDateAndDaysAgo(proposedAddress.createdAt)),
  ],
  links: linksForStatus(proposedAddress.status),
})

const linksForStatus = (status: ProposedAddressDto['status']) => {
  switch (status) {
    case 'CHECKED':
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
