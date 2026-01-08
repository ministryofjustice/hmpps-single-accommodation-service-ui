import { actionsForStatus, dutyToReferToCard, linksForStatus } from './dutyToRefer'
import { dutyToReferFactory } from '../testutils/factories'
import { formatDate } from './format'

describe('duty to refer utils', () => {
  describe('dutyToReferToCard', () => {
    it('returns duty to refer card', () => {
      const dutyToRefer = dutyToReferFactory.build()

      const card = dutyToReferToCard(dutyToRefer)

      expect(card).toContain('Duty to Refer (DTR)')
    })

    it('returns a NOT_STARTED duty to refer card', () => {
      const dutyToRefer = dutyToReferFactory.build({ status: 'NOT_STARTED', submittedTo: 'Local Authority One' })

      const card = dutyToReferToCard(dutyToRefer)

      expect(card).toMatchSnapshot()
    })

    it('returns a NOT_ELIGIBLE duty to refer card', () => {
      const dutyToRefer = dutyToReferFactory.build({ status: 'NOT_ELIGIBLE' })

      const card = dutyToReferToCard(dutyToRefer)

      expect(card).toMatchSnapshot()
    })

    it('returns a SUBMITTED duty to refer card', () => {
      const dutyToRefer = dutyToReferFactory.build({
        status: 'SUBMITTED',
        submittedTo: 'Local Authority One',
        reference: 'Jane Doe',
        submitted: '2025-12-01',
      })

      const card = dutyToReferToCard(dutyToRefer)

      expect(card).toMatchSnapshot()
    })

    it('returns an empty duty to refer card for unknown status', () => {
      const dutyToRefer = dutyToReferFactory.build({ status: 'UNKNOWN' })

      const card = dutyToReferToCard(dutyToRefer)

      expect(card).toMatchSnapshot()
    })
  })

  describe('actionsForStatus', () => {
    const baseDutyToRefer = {
      submittedTo: 'Local Authority One',
      reference: 'Jane Doe',
      submitted: '2024-09-23',
    }

    it.each([
      [[], 'NOT_ELIGIBLE' as const],
      [[], 'UPCOMING' as const],
      [[{ term: 'Local authority (likely)', description: baseDutyToRefer.submittedTo }], 'NOT_STARTED' as const],
      [
        [
          { term: 'Submitted to', description: baseDutyToRefer.submittedTo },
          { term: 'Reference', description: baseDutyToRefer.reference },
          {
            term: 'Submitted',
            description: `${formatDate(baseDutyToRefer.submitted)} (${formatDate(baseDutyToRefer.submitted, 'days ago/in')})`,
          },
        ],
        'SUBMITTED' as const,
      ],
      [[], 'UNKNOWN' as const],
    ])('returns actions %s for status %s', (expectedActions, status) => {
      const dutyToRefer = dutyToReferFactory.build({
        status,
        ...baseDutyToRefer,
      })

      const actions = actionsForStatus(dutyToRefer)

      expect(actions).toEqual(expect.arrayContaining(expectedActions.map(a => expect.objectContaining(a))))
      expect(actions).toHaveLength(expectedActions.length)
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
