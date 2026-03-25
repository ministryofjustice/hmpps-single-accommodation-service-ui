import { TimelineEntry } from '@govuk/ui'
import { AuditRecordDto } from '@sas/api'
import { toParagraphs } from './utils'

export const timelineEntry = (label: string, html: string, datetime?: string, author?: string): TimelineEntry => {
  return {
    label: {
      text: label,
    },
    datetime: datetime
      ? {
          timestamp: datetime,
          type: 'datetime',
        }
      : undefined,
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

  const html = toParagraphs(note.split('\n').filter(Boolean))

  return timelineEntry('Note added', html, commitDate, author)
}
