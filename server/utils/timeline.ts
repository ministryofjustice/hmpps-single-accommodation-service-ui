import { TimelineEntry } from '@govuk/ui'

// eslint-disable-next-line import/prefer-default-export
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
