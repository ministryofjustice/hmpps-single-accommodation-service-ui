import { timelineEntry } from './timeline'

describe('timelineEntry', () => {
  it('returns a timeline entry with the given details', () => {
    expect(
      timelineEntry('Entry label', '<p>Some content</p>', '2025-09-13T13:45:00.000Z', 'Bob Smith'),
    ).toMatchSnapshot()
  })
})
