import { TimelineEntry } from '@govuk/ui'
import { AuditRecordDto } from '@sas/api'
import { textBlock } from './macros'

export const timelineEntry = (label: string, html: string, datetime?: string, author?: string): TimelineEntry => {
  return {
    label: {
      text: label,
    },
    datetime: {
      timestamp: datetime,
      type: 'datetime',
    },
    byline: author
      ? {
          text: author,
        }
      : undefined,
    html,
  }
}

export const noteTimelineEntry = (auditRecord: AuditRecordDto): TimelineEntry => {
  const { commitDate, author } = auditRecord

  const note = auditRecord.changes.find(change => change.field === 'note')?.value

  if (!note) return undefined

  const html = textBlock(note)

  return timelineEntry('Note added', html, commitDate, author)
}
