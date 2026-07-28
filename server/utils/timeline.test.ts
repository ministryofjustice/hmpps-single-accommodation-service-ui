import { noteTimelineEntry, timelineEntry } from './timeline'
import { assignedUserFactory, auditRecordFactory } from '../testutils/factories'
import * as staffUtils from './staff'

describe('timelineEntry', () => {
  it('returns a timeline entry with the given details', () => {
    expect(
      timelineEntry('Entry label', '<p>Some content</p>', '2025-09-13T13:45:00.000Z', 'Bob Smith'),
    ).toMatchSnapshot()
  })

  it('returns a timeline entry with no datetime or author', () => {
    expect(timelineEntry('Title', 'Content')).toMatchSnapshot()
  })
})

describe('noteTimelineEntry', () => {
  it('returns a formatted note timeline entry', () => {
    jest.spyOn(staffUtils, 'staffName')

    const noteRecord = auditRecordFactory.note('Line 1\n\n\nLine 2').build({
      authorDetails: assignedUserFactory.build({
        forename: 'Jane',
        surname: 'Doe',
      }),
      commitDate: '2026-03-25T15:22:00.000Z',
    })

    expect(noteTimelineEntry(noteRecord, 'CURRENT_USER')).toMatchSnapshot()
    expect(staffUtils.staffName).toHaveBeenCalledWith(noteRecord.authorDetails, 'CURRENT_USER')
  })
})
