import { AccommodationAddressDetails, AccommodationDetail, AuditRecordDto } from '@sas/api'
import { TimelineEntry } from '@govuk/ui'
import { renderMacro } from './macros'
import {
  displayStatus,
  formatProposedAddressArrangement,
  formatProposedAddressSettledType,
  formatProposedAddressStatus,
  proposedAddressStatusTag,
} from './proposedAddresses'
import { formatAddress } from './addresses'

const timelineEntryLabels: Record<AuditRecordDto['type'], string> = {
  CREATE: 'Address added',
  UPDATE: 'Address updated',
}

// eslint-disable-next-line import/prefer-default-export
export const timelineEntry = (auditRecord: AuditRecordDto): TimelineEntry => {
  const proposedAddress = Object.fromEntries(
    auditRecord.changes.map(change => [change.field, change.value]),
  ) as AccommodationDetail
  const status = displayStatus(proposedAddress)

  let housingArrangement = formatProposedAddressArrangement(proposedAddress.arrangementSubType)
  if (proposedAddress.arrangementSubType === 'OTHER') {
    housingArrangement += ` (${proposedAddress.arrangementSubTypeDescription})`
  }
  housingArrangement += `. ${formatProposedAddressSettledType(proposedAddress.settledType)}.`

  return {
    label: {
      text: timelineEntryLabels[auditRecord.type],
    },
    datetime: {
      timestamp: auditRecord.commitDate,
      type: 'datetime',
    },
    byline: {
      text: auditRecord.author,
    },
    html: renderMacro('timelineProposedAddressCreated', {
      ...proposedAddress,
      status: proposedAddressStatusTag(status),
      address: formatAddress(proposedAddress as AccommodationAddressDetails),
      housingArrangement,
      checksStatus: formatProposedAddressStatus(status),
    }),
  }
}
