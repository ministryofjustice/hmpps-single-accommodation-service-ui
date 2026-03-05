import { detailsForStatus, dutyToReferStatusCard, linksForStatus } from './dutyToRefer'
import { dutyToReferFactory } from '../testutils/factories'
import { formatDateAndDaysAgo } from './dates'

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
      const dutyToRefer = dutyToReferFactory.notStarted().build()

      const card = dutyToReferStatusCard(dutyToRefer)

      expect(card).toMatchSnapshot()
    })

    it('returns a SUBMITTED duty to refer status card object', () => {
      const dutyToRefer = dutyToReferFactory
        .submitted()
        .build({ submission: { submissionDate: '2025-12-01', referenceNumber: 'REF123' } })

      const card = dutyToReferStatusCard(dutyToRefer)

      expect(card).toMatchSnapshot()
    })

    it('returns an empty duty to refer card for undefined duty to refer', () => {
      const card = dutyToReferStatusCard(undefined)

      expect(card).toMatchSnapshot()
    })
  })

  describe('detailsForStatus', () => {
    const submission = {
      id: 'submission-id',
      localAuthorityAreaId: 'la-id',
      referenceNumber: 'REF123',
      submissionDate: '2024-09-23',
      createdBy: 'user1',
      createdAt: '2024-09-23T00:00:00.000Z',
    }

    it.each([
      ['NOT_STARTED' as const, []],
      [
        'SUBMITTED' as const,
        [
          { term: 'Reference', description: submission.referenceNumber },
          { term: 'Submitted', description: formatDateAndDaysAgo(submission.submissionDate) },
        ],
      ],
      ['NOT_ACCEPTED' as const, []],
      ['ACCEPTED' as const, []],
    ])('returns details for status %s', (status, expectedDetails) => {
      const dutyToRefer = dutyToReferFactory.build({ status, submission })

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

    it('returns details with invalid date when submissionDate is missing', () => {
      const dutyToRefer = dutyToReferFactory.build({
        status: 'SUBMITTED',
        submission: { submissionDate: undefined, referenceNumber: undefined },
      })

      const details = detailsForStatus(dutyToRefer)

      expect(details).toHaveLength(2)
      expect(details[0].value.text).toBe('')
      expect(details[1].value.text).toBe('Invalid Date')
    })
  })

  describe('linksForStatus', () => {
    it.each([
      [['Add submission details', 'Notes'], 'NOT_STARTED' as const],
      [['Add outcome', 'Notes'], 'SUBMITTED' as const],
      [['Notes'], 'NOT_ACCEPTED' as const],
      [['Notes'], 'ACCEPTED' as const],
      [[], undefined],
    ])('returns links %s for status %s', (expectedLinks, status) => {
      const links = linksForStatus(status).map(link => link.text)

      expect(links).toEqual(expect.arrayContaining(expectedLinks))
      expect(links).toHaveLength(expectedLinks.length)
    })
  })
})
