import { detailsForStatus, dutyToReferStatusCard, linksForStatus } from './dutyToRefer'
import { dutyToReferFactory } from '../testutils/factories'
import { formatDate } from './format'

describe('duty to refer utils', () => {
  describe('dutyToReferStatusCard', () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2025-12-10'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('returns a duty to refer status card object', () => {
      const dutyToRefer = dutyToReferFactory.build()

      const card = dutyToReferStatusCard(dutyToRefer)

      expect(card.heading).toEqual('Duty to Refer (DTR)')
    })

    it('returns a NOT_STARTED duty to refer status card object', () => {
      const dutyToRefer = dutyToReferFactory.build({ status: 'NOT_STARTED', submittedTo: 'Local Authority One' })

      const card = dutyToReferStatusCard(dutyToRefer)

      expect(card).toMatchSnapshot()
    })

    it('returns a NOT_ELIGIBLE duty to refer status card object', () => {
      const dutyToRefer = dutyToReferFactory.build({ status: 'NOT_ELIGIBLE' })

      const card = dutyToReferStatusCard(dutyToRefer)

      expect(card).toMatchSnapshot()
    })

    it('returns a SUBMITTED duty to refer status card object', () => {
      const dutyToRefer = dutyToReferFactory.build({
        status: 'SUBMITTED',
        submittedTo: 'Local Authority One',
        reference: 'Jane Doe',
        submitted: '2025-12-01',
      })

      const card = dutyToReferStatusCard(dutyToRefer)

      expect(card).toMatchSnapshot()
    })

    it('returns an empty duty to refer card for unknown status', () => {
      const dutyToRefer = dutyToReferFactory.build({ status: 'UNKNOWN' })

      const card = dutyToReferStatusCard(dutyToRefer)

      expect(card).toMatchSnapshot()
    })
  })

  describe('detailsForStatus', () => {
    const baseDutyToRefer = {
      submittedTo: 'Local Authority One',
      reference: 'Jane Doe',
      submitted: '2024-09-23',
    }

    it.each([
      ['NOT_ELIGIBLE' as const, []],
      ['UPCOMING' as const, []],
      ['NOT_STARTED' as const, [{ term: 'Local authority (likely)', description: baseDutyToRefer.submittedTo }]],
      [
        'SUBMITTED' as const,
        [
          { term: 'Submitted to', description: baseDutyToRefer.submittedTo },
          { term: 'Reference', description: baseDutyToRefer.reference },
          {
            term: 'Submitted',
            description: `${formatDate(baseDutyToRefer.submitted)} (${formatDate(baseDutyToRefer.submitted, 'days ago/in')})`,
          },
        ],
      ],
      ['UNKNOWN' as const, []],
    ])('returns details for status %s', (status, expectedDetails) => {
      const dutyToRefer = dutyToReferFactory.build({
        status,
        ...baseDutyToRefer,
      })

      const details = detailsForStatus(dutyToRefer)

      const expectedRows = expectedDetails.map(detail =>
        expect.objectContaining({
          key: expect.objectContaining({ text: detail.term }),
          value: expect.objectContaining({ text: detail.description }),
        }),
      )

      expect(details).toEqual(expect.arrayContaining(expectedRows))
      expect(details).toHaveLength(expectedDetails.length)
    })

    it('returns empty detail when field is missing', () => {
      const dutyToRefer = dutyToReferFactory.build({
        status: 'NOT_STARTED',
        submittedTo: undefined,
      })

      const details = detailsForStatus(dutyToRefer)

      expect(details).toEqual([expect.objectContaining({ value: expect.objectContaining({ text: '' }) })])
    })
  })

  describe('linksForStatus', () => {
    it.each([
      [['Add submission details', 'Notes'], 'NOT_STARTED' as const],
      [['Notes'], 'NOT_ELIGIBLE' as const],
      [['Notes'], 'UPCOMING' as const],
      [['Add outcome', 'Notes'], 'SUBMITTED' as const],
      [[], 'UNKNOWN' as const],
    ])('returns links %s for status %s', (expectedLinks, status) => {
      const dutyToRefer = dutyToReferFactory.build({ status })

      const links = linksForStatus(dutyToRefer.status).map(link => link.text)

      expect(links).toEqual(expect.arrayContaining(expectedLinks))
      expect(links).toHaveLength(expectedLinks.length)
    })
  })
})
