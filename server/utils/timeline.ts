import { AuditRecordDto } from '@sas/api'
import { TimelineEntry } from '@govuk/ui'

const timelineEntryLabels: Record<AuditRecordDto['type'], string> = {
  CREATE: 'Address added',
  UPDATE: 'Address updated',
}

// eslint-disable-next-line import/prefer-default-export
export const timelineEntry = (auditRecord: AuditRecordDto): TimelineEntry => ({
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
  text: 'Some content',
})
