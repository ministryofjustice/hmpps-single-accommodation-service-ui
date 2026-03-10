import { Request } from 'express'
import { mock } from 'jest-mock-extended'
import {
  detailsForStatus,
  dutyToReferStatusCard,
  linksForStatus,
  summaryListRows,
  validateOutcome,
  validateSubmission,
} from './dutyToRefer'
import * as validationUtils from './validation'
import { dutyToReferFactory } from '../testutils/factories'
import { formatDateAndDaysAgo } from './dates'
import uiPaths from '../paths/ui'

let req: Request

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
      const dutyToRefer = dutyToReferFactory.notStarted().build({ crn: 'CRN123' })

      const card = dutyToReferStatusCard(dutyToRefer)

      expect(card).toMatchSnapshot()
    })

    it('returns a SUBMITTED duty to refer status card object', () => {
      const dutyToRefer = dutyToReferFactory
        .submitted()
        .build({ crn: 'CRN123', submission: { submissionDate: '2025-12-01', referenceNumber: 'REF123' } })

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
      localAuthority: { localAuthorityAreaId: 'la-id', localAuthorityAreaName: 'la-name' },
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
      const links = linksForStatus(status, 'CRN123').map(link => link.text)

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
    }

    it('formats case data without duty to refer', () => {
      const rows = summaryListRows(caseData)

      expect(rows).toHaveLength(4)
      expect(rows[0].key.text).toBe('Name')
      expect(rows[0].value.text).toBe('John Smith')
      expect(rows[1].key.text).toBe('Date of birth')
      expect(rows[1].value.text).toBe('1990-01-15')
      expect(rows[2].key.text).toBe('CRN')
      expect(rows[2].value.text).toBe('CRN123')
      expect(rows[3].key.text).toBe('Prison number')
      expect(rows[3].value.text).toBe('A1234BC')
    })

    it('formats case data with submission date', () => {
      const dutyToRefer = dutyToReferFactory.submitted().build({
        submission: { submissionDate: '2025-01-10' },
      })

      const rows = summaryListRows(caseData, dutyToRefer)

      expect(rows).toHaveLength(5)
      expect(rows[4].key.text).toBe('Submission date')
      expect(rows[4].value.text).toBe(formatDateAndDaysAgo('2025-01-10'))
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

    it('sets errors and returns a redirect link when submission date and local authority are missing', () => {
      req.body = {}
      const result = validateSubmission(req)

      expect(validationUtils.validateAndFlashErrors).toHaveBeenCalledWith(req, {
        submissionDate: 'Enter a submission date',
        localAuthorityAreaId: 'Select a local authority',
      })
      expect(result).toBe(uiPaths.dutyToRefer.submission({ crn: 'CRN123' }))
    })

    it('returns undefined when submission date and local authority are valid', () => {
      req.body = {
        localAuthorityAreaId: 'la-id',
        'submissionDate-day': '1',
        'submissionDate-month': '2',
        'submissionDate-year': '2025',
      }

      const result = validateSubmission(req)

      expect(result).toBeUndefined()
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

    it('sets errors and returns a redirect link when outcome status is missing', () => {
      req.body = {}
      const result = validateOutcome(req)

      expect(validationUtils.validateAndFlashErrors).toHaveBeenCalledWith(req, {
        outcomeStatus: 'Select duty to refer outcome',
      })
      expect(result).toBe(uiPaths.dutyToRefer.outcome({ crn: 'CRN123' }))
    })

    it('returns undefined when outcome status is valid', () => {
      req.body = {
        outcomeStatus: 'ACCEPTED',
      }

      const result = validateOutcome(req)

      expect(result).toBeUndefined()
    })
  })
})
