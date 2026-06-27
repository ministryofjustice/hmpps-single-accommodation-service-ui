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
import {
  actionFactory,
  auditRecordFactory,
  caseFactory,
  dtrServiceResultFactory,
  dtrSubmissionFactory,
  dutyToReferFactory,
  serviceResultFactory,
} from '../testutils/factories'
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
      const dutyToRefer = dtrServiceResultFactory.build()

      const card = dutyToReferStatusCard('CRN123', dutyToRefer)

      expect(card.heading).toEqual('Duty to Refer (DTR)')
    })

    it('returns a NOT_STARTED duty to refer status card object', () => {
      const dutyToRefer = dtrServiceResultFactory.notStarted().build()

      const card = dutyToReferStatusCard('CRN123', dutyToRefer)

      expect(card).toMatchSnapshot()
    })

    it('returns a SUBMITTED duty to refer status card object', () => {
      const dutyToRefer = dtrServiceResultFactory.submitted().build({
        submission: {
          id: 'submission-id',
          submissionDate: '2025-12-01',
          referenceNumber: 'REF123',
          localAuthority: { localAuthorityAreaName: 'Some Council' },
          createdBy: 'user1',
          createdAt: '2025-12-01T10:00:00.000Z',
        },
      })

      const card = dutyToReferStatusCard('CRN123', dutyToRefer)

      expect(card).toMatchSnapshot()
    })

    it('returns a NOT_ELIGIBLE duty to refer status card object', () => {
      const dutyToRefer = dtrServiceResultFactory.notEligible().build()

      const card = dutyToReferStatusCard('CRN123', dutyToRefer)

      expect(card).toMatchSnapshot()
    })

    it('returns an empty duty to refer card for undefined duty to refer', () => {
      const card = dutyToReferStatusCard('CRN123', undefined)

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
    const rows = [
      { term: 'Submitted to', description: 'Some Council' },
      { term: 'Reference', description: submission.referenceNumber },
      { term: 'Submitted', description: formatDateAndDaysAgo(submission.submissionDate) },
      { term: 'Submitted by', description: submission.createdBy },
    ]

    it.each([
      ['NOT_STARTED' as const, []],
      ['SUBMITTED' as const, rows],
      ['NOT_ACCEPTED' as const, rows],
      ['ACCEPTED' as const, rows],
      ['NOT_ELIGIBLE' as const, []],
      [undefined, []],
    ])('returns details for status %s', (status, expectedDetails) => {
      const serviceResult = serviceResultFactory.build({ serviceStatus: status })
      const dutyToRefer = dtrServiceResultFactory.build({ serviceResult, submission })

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
        expectedLinks: ['Add referral details'],
        dtr: dtrServiceResultFactory.notStarted().build(),
      },
      {
        status: 'submitted',
        expectedLinks: ['View referral'],
        dtr: dtrServiceResultFactory.submitted().build(),
      },
      {
        status: 'not accepted',
        expectedLinks: ['View referral'],
        dtr: dtrServiceResultFactory.notAccepted().build(),
      },
      {
        status: 'accepted',
        expectedLinks: ['View referral'],
        dtr: dtrServiceResultFactory.accepted().build(),
      },
      { status: 'not eligible', expectedLinks: [], dtr: dtrServiceResultFactory.notEligible().build() },
      { status: 'upcoming', expectedLinks: [], dtr: dtrServiceResultFactory.upcoming().build() },
      { status: 'undefined', expectedLinks: [], dtr: undefined },
    ])('returns links $links for status $status', ({ expectedLinks, dtr }) => {
      const links = linksForStatus(dtr, 'CRN123').map(link => link.text)

      expect(links).toEqual(expect.arrayContaining(expectedLinks))
      expect(links).toHaveLength(expectedLinks.length)
    })
  })

  describe('summaryListRows', () => {
    const caseData = caseFactory.build({
      crn: 'CRN123',
      name: 'John Smith',
      dateOfBirth: '1990-01-15',
      prisonNumber: 'A1234BC',
      actions: [
        actionFactory.build({ type: 'SUBMIT_CRS_REFERRAL', startDate: '2026-11-01' }),
        actionFactory.build({ type: 'START_APPROVED_PREMISE_APPLICATION', startDate: null }),
      ],
    })

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
      expect(rows[5].key.text).toBe('Date submitted')
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
      submissionNote: 'This is a submission note',
    }

    it.each(['SUBMITTED', 'ACCEPTED', 'NOT_ACCEPTED'] as const)('returns correct rows for status %s', status => {
      const dtr = dutyToReferFactory.build({ status, submission })

      expect(detailsSummaryListRows(dtr)).toMatchSnapshot()
    })
  })

  describe('outcomeDetailsSummaryListRows', () => {
    const submission = {
      id: 'submission-id',
      localAuthority: { localAuthorityAreaId: 'la-id', localAuthorityAreaName: 'Some Council' },
      referenceNumber: 'REF123',
      submissionDate: '2024-09-23',
      createdBy: 'user1',
      createdAt: '2024-09-23T00:00:00.000Z',
      outcomeReason: 'INTENTIONALLY_HOMELESS' as const,
      outcomeNote: 'This is an outcome note',
    }

    it.each(['SUBMITTED', 'ACCEPTED', 'NOT_ACCEPTED'] as const)('returns correct rows for status %s', status => {
      const dtr = dutyToReferFactory.build({ status, submission })

      expect(outcomeDetailsSummaryListRows(dtr)).toMatchSnapshot()
    })
  })

  describe('outcomeSupportText', () => {
    it.each([
      ['ACCEPTED', 'Some Council agreed to support this person with housing'],
      ['NOT_ACCEPTED', 'Some Council will not support this person with housing'],
    ] as const)('returns %s text for %s status', (status, expectedText) => {
      const dutyToRefer = dutyToReferFactory.build({
        status,
        submission: dtrSubmissionFactory.build({
          localAuthority: { localAuthorityAreaId: '1', localAuthorityAreaName: 'Some Council' },
        }),
      })
      expect(outcomeSupportText(dutyToRefer)).toBe(expectedText)
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
        submissionDate: 'Enter a date',
        localAuthorityAreaId: 'Enter a local authority',
      })
      expect(result).toEqual(false)
    })

    it('returns true when submission date, local authority, and reference number are valid', () => {
      req.body = {
        localAuthorityAreaId: 'la-id',
        'submissionDate-day': '1',
        'submissionDate-month': '2',
        'submissionDate-year': '2025',
        referenceNumber: 'REF123',
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
        outcomeReason: 'Select a Duty to Refer (DTR) outcome',
      })
      expect(result).toBe(false)
    })

    it('returns true when outcome reason is valid', () => {
      req.body = {
        outcomeReason: 'INTENTIONALLY_HOMELESS',
      }

      const result = validateOutcome(req)

      expect(result).toBe(true)
    })
  })

  describe('dutyToReferTimelineEntry', () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2025-12-10'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('returns a timeline entry for a note', () => {
      const auditRecord = auditRecordFactory.note('Some note\nline 2').build({
        commitDate: '2025-04-15T14:30:00.000Z',
        author: 'Jane Doe',
      })

      expect(dutyToReferTimelineEntry(auditRecord)).toMatchSnapshot()
    })

    it('returns a timeline entry for a submission added record', () => {
      const submission = dtrSubmissionFactory.build({
        submissionDate: '2025-04-12',
        localAuthority: { localAuthorityAreaId: 'la-1', localAuthorityAreaName: 'Cherwell District Council' },
        referenceNumber: 'REF123',
      })
      const auditRecord = auditRecordFactory.dutyToReferAdded(submission).build({
        commitDate: '2025-04-12T17:07:00.000Z',
        author: 'Jane Doe',
      })

      expect(dutyToReferTimelineEntry(auditRecord)).toMatchSnapshot()
    })

    it('returns a timeline entry for a submission updated record', () => {
      const submission = dtrSubmissionFactory.build({
        submissionDate: '2025-04-14',
        localAuthority: { localAuthorityAreaId: 'la-2', localAuthorityAreaName: 'Oxford City Council' },
        referenceNumber: 'REF456',
      })
      const auditRecord = auditRecordFactory.dutyToReferUpdated(submission).build({
        commitDate: '2025-04-15T10:00:00.000Z',
        author: 'Jane Doe',
      })

      expect(dutyToReferTimelineEntry(auditRecord)).toMatchSnapshot()
    })

    it('does not render Invalid Date when submissionDate is not present', () => {
      const submission = dtrSubmissionFactory.build({
        submissionDate: null,
        localAuthority: { localAuthorityAreaId: 'la-2', localAuthorityAreaName: 'Oxford City Council' },
        referenceNumber: 'REF456',
      })
      const auditRecord = auditRecordFactory.dutyToReferUpdated(submission).build({
        commitDate: '2025-04-15T10:00:00.000Z',
        author: 'Jane Doe',
      })

      const entry = dutyToReferTimelineEntry(auditRecord)

      expect(entry.html).not.toContain('Invalid Date')
    })

    it('shows local authority in submission changes when local authority is changed', () => {
      const auditRecord = auditRecordFactory.build({
        type: 'UPDATE',
        commitDate: '2025-04-16T10:00:00.000Z',
        author: 'Jane Doe',
        changes: [
          { field: 'localAuthorityAreaId', value: 'la-4' },
          { field: 'submissionDate', value: '2025-04-16' },
          { field: 'referenceNumber', value: 'REF999' },
        ],
        extraInformation: { localAuthorityAreaName: 'South Oxfordshire District Council' },
      })

      expect(dutyToReferTimelineEntry(auditRecord)).toMatchSnapshot()
    })

    it('shows reference removed when reference is changed to blank', () => {
      const auditRecord = auditRecordFactory.build({
        type: 'UPDATE',
        commitDate: '2025-04-16T11:00:00.000Z',
        author: 'Jane Doe',
        changes: [{ field: 'referenceNumber', value: '', oldValue: 'REF999' }],
        extraInformation: { localAuthorityAreaName: 'Oxford City Council' },
      })

      expect(dutyToReferTimelineEntry(auditRecord)).toMatchSnapshot()
    })

    it('does not show local authority when only submission date is changed', () => {
      const auditRecord = auditRecordFactory.build({
        type: 'UPDATE',
        commitDate: '2025-04-17T09:00:00.000Z',
        author: 'Jane Doe',
        changes: [{ field: 'submissionDate', value: '2025-04-17' }],
        extraInformation: { localAuthorityAreaName: 'Oxford City Council' },
      })

      expect(dutyToReferTimelineEntry(auditRecord)).toMatchSnapshot()
    })

    it('shows local authority but not reference when only local authority is changed', () => {
      const auditRecord = auditRecordFactory.build({
        type: 'UPDATE',
        commitDate: '2025-04-17T10:00:00.000Z',
        author: 'Jane Doe',
        changes: [{ field: 'localAuthorityAreaId', value: 'la-5' }],
        extraInformation: { localAuthorityAreaName: 'Vale of White Horse District Council' },
      })

      expect(dutyToReferTimelineEntry(auditRecord)).toMatchSnapshot()
    })

    it('returns a timeline entry for an outcome added record', () => {
      const auditRecord = auditRecordFactory
        .dutyToReferUpdated(
          dtrSubmissionFactory.build({
            localAuthority: { localAuthorityAreaId: 'la-1', localAuthorityAreaName: 'Cherwell District Council' },
            outcomeReason: 'PREVENTION_AND_RELIEF_DUTY',
          }),
          'ACCEPTED',
          { localAuthorityAreaName: 'Cherwell District Council' },
          'SUBMITTED',
        )
        .build({
          commitDate: '2025-04-15T15:38:00.000Z',
          author: 'Jane Doe',
        })

      expect(dutyToReferTimelineEntry(auditRecord)).toMatchSnapshot()
    })

    it('returns a timeline entry for an outcome updated record', () => {
      const auditRecord = auditRecordFactory
        .dutyToReferUpdated(
          dtrSubmissionFactory.build({
            localAuthority: { localAuthorityAreaId: 'la-2', localAuthorityAreaName: 'Oxford City Council' },
            outcomeReason: 'INTENTIONALLY_HOMELESS',
          }),
          'NOT_ACCEPTED',
          { localAuthorityAreaName: 'Oxford City Council' },
        )
        .build({
          commitDate: '2025-04-16T09:00:00.000Z',
          author: 'Jane Doe',
        })

      expect(dutyToReferTimelineEntry(auditRecord)).toMatchSnapshot()
    })

    it('does not include outcome support text when only reason is updated', () => {
      const auditRecord = auditRecordFactory
        .dutyToReferUpdated(
          dtrSubmissionFactory.build({
            localAuthority: { localAuthorityAreaId: 'la-2', localAuthorityAreaName: 'Oxford City Council' },
            outcomeReason: 'NO_LOCAL_CONNECTION',
          }),
          'NOT_ACCEPTED',
          { localAuthorityAreaName: 'Oxford City Council' },
        )
        .build({
          commitDate: '2025-04-16T09:00:00.000Z',
          author: 'Jane Doe',
        })

      expect(dutyToReferTimelineEntry(auditRecord)).toMatchSnapshot()
    })

    it('includes outcome support text when outcome is updated with a status change', () => {
      const auditRecord = auditRecordFactory
        .dutyToReferUpdated(
          dtrSubmissionFactory.build({
            localAuthority: {
              localAuthorityAreaId: 'la-3',
              localAuthorityAreaName: 'West Oxfordshire District Council',
            },
            outcomeReason: 'PREVENTION_AND_RELIEF_DUTY',
          }),
          'ACCEPTED',
          { localAuthorityAreaName: 'West Oxfordshire District Council' },
          'NOT_ACCEPTED',
        )
        .build({
          commitDate: '2025-04-16T09:00:00.000Z',
          author: 'Jane Doe',
        })

      expect(dutyToReferTimelineEntry(auditRecord)).toMatchSnapshot()
    })
  })
})
