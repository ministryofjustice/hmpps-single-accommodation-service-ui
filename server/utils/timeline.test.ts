import { noteTimelineEntry, timelineEntry } from './timeline'
import { auditRecordFactory } from '../testutils/factories'

describe('timelineEntry', () => {
  it('returns a timeline entry with the given details', () => {
    expect(
      timelineEntry('Entry label', '<p>Some content</p>', '2025-09-13T13:45:00.000Z', 'Bob Smith'),
    ).toMatchSnapshot()
  })
})

describe('noteTimelineEntry', () => {
  it('returns a formatted note timeline entry', () => {
    const noteRecord = auditRecordFactory.note('Line 1\n\n\nLine 2').build({
      author: 'Jane Doe',
      commitDate: '2026-03-25T15:22:00.000Z',
    })

    expect(noteTimelineEntry(noteRecord)).toMatchSnapshot()
  })
})
