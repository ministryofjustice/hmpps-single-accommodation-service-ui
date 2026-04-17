import { Request } from 'express'
import { mock } from 'jest-mock-extended'
import {
  detailsForStatus,
  detailsSummaryListRows,
  dutyToReferStatusCard,
  dutyToReferTimelineEntry,
  linksForStatus,
  outcomeDetailsSummaryListRows,
  outcomeSupportText,
  summaryListRows,
  validateOutcome,
  validateSubmission,
} from './dutyToRefer'
import * as validationUtils from './validation'
import { auditRecordFactory, dtrSubmissionFactory, dutyToReferFactory } from '../testutils/factories'
import { formatDateAndDaysAgo } from './dates'

describe('duty to refer utils', () => {
  let req: Request

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
      const dutyToRefer = dutyToReferFactory.notStarted().build({ crn: 'CRN123' })

      const card = dutyToReferStatusCard(dutyToRefer)

      expect(card).toMatchSnapshot()
    })

    it('returns a SUBMITTED duty to refer status card object', () => {
      const dutyToRefer = dutyToReferFactory.submitted().build({
        crn: 'CRN123',
        submission: {
          id: 'submission-id',
          submissionDate: '2025-12-01',
          referenceNumber: 'REF123',
          localAuthority: { localAuthorityAreaName: 'Some Council' },
        },
      })

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
      localAuthority: { localAuthorityAreaId: 'la-id', localAuthorityAreaName: 'Some Council' },
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
          { term: 'Submitted to', description: 'Some Council' },
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
  })

  describe('linksForStatus', () => {
    it.each([
      {
        status: 'not started',
        expectedLinks: ['Add submission details'],
        dtr: dutyToReferFactory.notStarted().build(),
      },
      {
        status: 'submitted',
        expectedLinks: ['Add outcome', 'View referral and notes'],
        dtr: dutyToReferFactory.submitted().build(),
      },
      {
        status: 'not accepted',
        expectedLinks: ['View referral and notes'],
        dtr: dutyToReferFactory.notAccepted().build(),
      },
      { status: 'accepted', expectedLinks: ['View referral and notes'], dtr: dutyToReferFactory.accepted().build() },
      { status: 'undefined', expectedLinks: [], dtr: undefined },
    ])('returns links $links for status $status', ({ expectedLinks, dtr }) => {
      const links = linksForStatus(dtr).map(link => link.text)

      expect(links).toEqual(expect.arrayContaining(expectedLinks))
      expect(links).toHaveLength(expectedLinks.length)
    })
  })

  describe('summaryListRows', () => {
    const caseData = {
      crn: 'CRN123',
      name: 'John Smith',
      dateOfBirth: '1990-01-15',
      prisonNumber: 'A1234BC',
      actions: ['action1', 'action2'],
    }

    it('formats case data without duty to refer', () => {
      const rows = summaryListRows(caseData)

      expect(rows).toHaveLength(4)
      expect(rows[0].key.text).toBe('Name')
      expect(rows[0].value.text).toBe('John Smith')
      expect(rows[1].key.text).toBe('Date of birth')
      expect(rows[1].value.text).toBe('15 January 1990 (36)')
      expect(rows[2].key.text).toBe('CRN')
      expect(rows[2].value.text).toBe('CRN123')
      expect(rows[3].key.text).toBe('Prison number')
      expect(rows[3].value.text).toBe('A1234BC')
    })

    it('formats case data with submission date and local authority', () => {
      const dutyToRefer = dutyToReferFactory.submitted().build({
        submission: { submissionDate: '2025-01-10', localAuthority: { localAuthorityAreaName: 'Some Council' } },
      })

      const rows = summaryListRows(caseData, dutyToRefer)

      expect(rows).toHaveLength(6)
      expect(rows[4].key.text).toBe('Local authority')
      expect(rows[4].value.text).toBe('Some Council')
      expect(rows[5].key.text).toBe('Submission date')
      expect(rows[5].value.text).toBe(formatDateAndDaysAgo('2025-01-10'))
    })
  })

  describe('detailsSummaryListRows', () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-21'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    const submission = {
      id: 'submission-id',
      localAuthority: { localAuthorityAreaId: 'la-id', localAuthorityAreaName: 'Some Council' },
      referenceNumber: 'REF123',
      submissionDate: '2024-09-23',
      createdBy: 'user1',
      createdAt: '2024-09-23T00:00:00.000Z',
    }

    it.each(['NOT_STARTED', 'SUBMITTED', 'ACCEPTED', 'NOT_ACCEPTED'] as const)(
      'returns correct rows for status %s',
      status => {
        const dtr = dutyToReferFactory.build({ status, submission })

        expect(detailsSummaryListRows(dtr)).toMatchSnapshot()
      },
    )
  })

  describe('outcomeDetailsSummaryListRows', () => {
    const submission = {
      id: 'submission-id',
      localAuthority: { localAuthorityAreaId: 'la-id', localAuthorityAreaName: 'Some Council' },
      referenceNumber: 'REF123',
      submissionDate: '2024-09-23',
      createdBy: 'user1',
      createdAt: '2024-09-23T00:00:00.000Z',
    }

    it.each(['NOT_STARTED', 'SUBMITTED', 'ACCEPTED', 'NOT_ACCEPTED'] as const)(
      'returns correct rows for status %s',
      status => {
        const dtr = dutyToReferFactory.build({ status, submission })

        expect(outcomeDetailsSummaryListRows(dtr)).toMatchSnapshot()
      },
    )
  })

  describe('outcomeSupportText', () => {
    it.each([
      ['ACCEPTED', 'Some Council agreed to support this person with housing'],
      ['NOT_ACCEPTED', 'Some Council will not support this person with housing'],
    ] as const)('returns %s text for %s status', (status, expectedText) => {
      expect(outcomeSupportText(status, 'Some Council')).toBe(expectedText)
    })
  })

  describe('validateSubmission', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      req = mock<Request>({
        params: { crn: 'CRN123' },
        body: {},
        session: {},
      })
      jest.spyOn(validationUtils, 'validateAndFlashErrors')
    })

    it('sets errors and returns false when submission date and local authority are missing', () => {
      req.body = {}
      const result = validateSubmission(req)

      expect(validationUtils.validateAndFlashErrors).toHaveBeenCalledWith(req, {
        submissionDate: 'Enter a submission date',
        localAuthorityAreaId: 'Select a local authority',
      })
      expect(result).toEqual(false)
    })

    it('returns true when submission date and local authority are valid', () => {
      req.body = {
        localAuthorityAreaId: 'la-id',
        'submissionDate-day': '1',
        'submissionDate-month': '2',
        'submissionDate-year': '2025',
      }

      const result = validateSubmission(req)

      expect(result).toBe(true)
    })
  })

  describe('validateOutcome', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      req = mock<Request>({
        params: { crn: 'CRN123' },
        body: {},
        session: {},
      })
      jest.spyOn(validationUtils, 'validateAndFlashErrors')
    })

    it('sets errors and returns false when outcome status is missing', () => {
      req.body = {}
      const result = validateOutcome(req)

      expect(validationUtils.validateAndFlashErrors).toHaveBeenCalledWith(req, {
        outcomeStatus: 'Select duty to refer outcome',
      })
      expect(result).toBe(false)
    })

    it('returns true when outcome status is valid', () => {
      req.body = {
        outcomeStatus: 'ACCEPTED',
      }

      const result = validateOutcome(req)

      expect(result).toBe(true)
    })
  })

  describe('dutyToReferTimelineEntry', () => {
    it('returns a timeline entry for a note', () => {
      const auditRecord = auditRecordFactory.note('Some note\nline 2').build({
        commitDate: '2026-04-15T14:30:00.000Z',
        author: 'Jane Doe',
      })

      expect(dutyToReferTimelineEntry(auditRecord)).toMatchSnapshot()
    })

    it('returns a timeline entry for a created record', () => {
      const auditRecord = auditRecordFactory.dutyToReferCreated().build({
        commitDate: '2026-04-12T13:15:00.000Z',
        author: 'System',
      })

      expect(dutyToReferTimelineEntry(auditRecord)).toMatchSnapshot()
    })

    it('returns a timeline entry for a submission added record', () => {
      const submission = dtrSubmissionFactory.build({
        submissionDate: '2026-04-12',
        localAuthority: { localAuthorityAreaId: 'la-1', localAuthorityAreaName: 'Cherwell District Council' },
        referenceNumber: 'REF123',
      })
      const auditRecord = auditRecordFactory.dutyToReferSubmissionAdded(submission).build({
        commitDate: '2026-04-12T17:07:00.000Z',
        author: 'Jane Doe',
      })

      expect(dutyToReferTimelineEntry(auditRecord)).toMatchSnapshot()
    })

    it('returns a timeline entry for a submission updated record', () => {
      const submission = dtrSubmissionFactory.build({
        submissionDate: '2026-04-14',
        localAuthority: { localAuthorityAreaId: 'la-2', localAuthorityAreaName: 'Oxford City Council' },
        referenceNumber: 'REF456',
      })
      const auditRecord = auditRecordFactory.dutyToReferSubmissionEdited(submission).build({
        commitDate: '2026-04-15T10:00:00.000Z',
        author: 'Jane Doe',
      })

      expect(dutyToReferTimelineEntry(auditRecord)).toMatchSnapshot()
    })

    it('returns a timeline entry for an outcome added record', () => {
      const auditRecord = auditRecordFactory.dutyToReferOutcomeAdded('ACCEPTED', 'Cherwell District Council').build({
        commitDate: '2026-04-15T15:38:00.000Z',
        author: 'Jane Doe',
      })

      expect(dutyToReferTimelineEntry(auditRecord)).toMatchSnapshot()
    })

    it('returns a timeline entry for an outcome updated record', () => {
      const auditRecord = auditRecordFactory.dutyToReferOutcomeEdited('NOT_ACCEPTED', 'Oxford City Council').build({
        commitDate: '2026-04-16T09:00:00.000Z',
        author: 'Jane Doe',
      })

      expect(dutyToReferTimelineEntry(auditRecord)).toMatchSnapshot()
    })
  })
})
