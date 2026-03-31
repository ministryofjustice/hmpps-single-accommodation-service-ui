import { NextFunction, Request, Response } from 'express'
import { mock } from 'jest-mock-extended'
import DutyToReferController from './dutyToReferController'
import AuditService, { Page } from '../services/auditService'
import DutyToReferService from '../services/dutyToReferService'
import CasesService from '../services/casesService'
import ReferenceDataService from '../services/referenceDataService'
import uiPaths from '../paths/ui'
import * as dutyToReferUtils from '../utils/dutyToRefer'
import { detailsSummaryListRows, outcomeDetailsSummaryListRows } from '../utils/dutyToRefer'
import * as validationUtils from '../utils/validation'
import { caseFactory, dutyToReferFactory, referenceDataFactory } from '../testutils/factories'
import { caseAssignedTo } from '../utils/cases'

describe('dutyToReferController', () => {
  let request: Request
  const response = mock<Response>({ locals: { user: { username: 'user1', token: 'token-1' } } })
  const next = mock<NextFunction>()

  const auditService = mock<AuditService>()
  const dutyToReferService = mock<DutyToReferService>()
  const casesService = mock<CasesService>()
  const referenceDataService = mock<ReferenceDataService>()

  const caseData = caseFactory.build({ name: 'James Smith', crn: 'CRN123' })
  const localAuthorities = referenceDataFactory.localAuthority().buildList(3)

  let controller: DutyToReferController

  beforeEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()

    casesService.getCase.mockResolvedValue(caseData)
    referenceDataService.getLocalAuthorities.mockResolvedValue(localAuthorities)

    request = mock<Request>({
      id: 'request-id',
      params: { crn: 'CRN123' },
      body: {},
      flash: jest.fn(),
    })

    controller = new DutyToReferController(auditService, dutyToReferService, casesService, referenceDataService)
    jest
      .spyOn(validationUtils, 'fetchErrorsAndUserInput')
      .mockReturnValue({ errors: {}, errorSummary: [], userInput: {} })
  })

  describe('guidance', () => {
    it('renders the guidance page', async () => {
      await controller.guidance()(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.DUTY_TO_REFER_GUIDANCE, {
        who: 'user1',
        correlationId: 'request-id',
      })
      expect(response.render).toHaveBeenCalledWith('pages/duty-to-refer/guidance', {
        crn: 'CRN123',
      })
    })
  })

  describe('submission', () => {
    it('renders the submission page', async () => {
      jest.spyOn(dutyToReferUtils, 'summaryListRows').mockReturnValue([])

      await controller.submission()(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.DUTY_TO_REFER_SUBMISSION, {
        who: 'user1',
        correlationId: 'request-id',
      })
      expect(casesService.getCase).toHaveBeenCalledWith('token-1', 'CRN123')
      expect(referenceDataService.getLocalAuthorities).toHaveBeenCalledWith('token-1')
      expect(response.render).toHaveBeenCalledWith('pages/duty-to-refer/submission', {
        crn: 'CRN123',
        tableRows: [],
        localAuthorities,
        errors: {},
        errorSummary: [],
        formValues: {},
        submissionFlow: 'add',
      })
    })

    it('renders the submission page with errors and user input', async () => {
      jest.spyOn(dutyToReferUtils, 'summaryListRows').mockReturnValue([])
      const userInput = {
        referenceNumber: 'REF123',
        'submissionDate-year': '2025',
        'submissionDate-month': '06',
        'submissionDate-day': '15',
      }
      jest.spyOn(validationUtils, 'fetchErrorsAndUserInput').mockReturnValue({
        errors: { localAuthorityAreaId: { text: 'Select a local authority' } },
        errorSummary: [{ text: 'Select a local authority', href: '#localAuthorityAreaId' }],
        userInput,
      })

      await controller.submission()(request, response, next)

      expect(response.render).toHaveBeenCalledWith('pages/duty-to-refer/submission', {
        crn: 'CRN123',
        tableRows: [],
        localAuthorities,
        errors: { localAuthorityAreaId: { text: 'Select a local authority' } },
        errorSummary: [{ text: 'Select a local authority', href: '#localAuthorityAreaId' }],
        formValues: userInput,
        submissionFlow: 'add',
      })
    })
  })

  describe('saveSubmission', () => {
    beforeEach(() => {
      request = mock<Request>({
        params: { crn: 'CRN123' },
        body: {
          localAuthorityAreaId: 'la-id',
          referenceNumber: 'REF123',
          'submissionDate-year': '2025',
          'submissionDate-month': '06',
          'submissionDate-day': '15',
        },
        flash: jest.fn(),
      })
    })

    it('submits and redirects to the case page', async () => {
      jest.spyOn(dutyToReferUtils, 'validateSubmission').mockReturnValue(true)

      await controller.saveSubmission()(request, response, next)

      expect(dutyToReferService.submit).toHaveBeenCalledWith('token-1', 'CRN123', {
        status: 'SUBMITTED',
        submissionDate: '2025-06-15',
        localAuthorityAreaId: 'la-id',
        referenceNumber: 'REF123',
      })
      expect(request.flash).toHaveBeenCalledWith('success', 'Submission details added')
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.cases.show({ crn: 'CRN123' }))
    })

    it('updates and redirects to the case page when in edit flow', async () => {
      const dutyToRefer = dutyToReferFactory.submitted().build({ crn: 'CRN123' })
      dutyToReferService.getDutyToRefer.mockResolvedValue(dutyToRefer)

      jest.spyOn(dutyToReferUtils, 'validateSubmission').mockReturnValue(true)
      request.query = { flow: 'edit' }

      await controller.saveSubmission()(request, response, next)

      expect(dutyToReferService.update).toHaveBeenCalledWith('token-1', 'CRN123', dutyToRefer.submission.id, {
        status: 'SUBMITTED',
        submissionDate: '2025-06-15',
        localAuthorityAreaId: 'la-id',
        referenceNumber: 'REF123',
      })

      expect(request.flash).toHaveBeenCalledWith('success', 'Submission details updated')
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.cases.show({ crn: 'CRN123' }))
    })

    it('redirects to submission page when validation fails', async () => {
      jest.spyOn(dutyToReferUtils, 'validateSubmission').mockReturnValue(false)
      await controller.saveSubmission()(request, response, next)

      expect(dutyToReferService.submit).not.toHaveBeenCalled()
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.dutyToRefer.submission({ crn: 'CRN123' }))
    })

    it('keeps edit flow when validation fails', async () => {
      jest.spyOn(dutyToReferUtils, 'validateSubmission').mockReturnValue(false)
      request.query = { flow: 'edit' }

      await controller.saveSubmission()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(`${uiPaths.dutyToRefer.submission({ crn: 'CRN123' })}?flow=edit`)
    })

    it('redirects back when the API call fails', async () => {
      jest.spyOn(dutyToReferUtils, 'validateSubmission').mockReturnValue(true)
      dutyToReferService.submit.mockRejectedValueOnce(new Error('API error'))

      await controller.saveSubmission()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(uiPaths.dutyToRefer.submission({ crn: 'CRN123' }))
    })

    it('keeps edit flow when the API call fails', async () => {
      const dtr = dutyToReferFactory.submitted().build({ crn: 'CRN123' })
      dutyToReferService.getDutyToRefer.mockResolvedValue(dtr)

      jest.spyOn(dutyToReferUtils, 'validateSubmission').mockReturnValue(true)
      request.query = { flow: 'edit' }

      dutyToReferService.update.mockRejectedValueOnce(new Error('API error'))

      await controller.saveSubmission()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(`${uiPaths.dutyToRefer.submission({ crn: 'CRN123' })}?flow=edit`)
    })
  })

  describe('outcome', () => {
    it('renders the outcome page', async () => {
      const dtr = dutyToReferFactory.submitted().build({ crn: 'CRN123' })
      dutyToReferService.getDutyToRefer.mockResolvedValue(dtr)
      jest.spyOn(dutyToReferUtils, 'summaryListRows').mockReturnValue([])

      await controller.outcome()(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.DUTY_TO_REFER_OUTCOME, {
        who: 'user1',
        correlationId: 'request-id',
      })
      expect(casesService.getCase).toHaveBeenCalledWith('token-1', 'CRN123')
      expect(dutyToReferService.getDutyToRefer).toHaveBeenCalledWith('token-1', 'CRN123')
      expect(response.render).toHaveBeenCalledWith('pages/duty-to-refer/outcome', {
        crn: 'CRN123',
        tableRows: [],
        errors: {},
        errorSummary: [],
        outcomeFlow: 'add',
      })
    })
  })

  describe('saveOutcome', () => {
    const dtr = dutyToReferFactory.submitted().build({
      crn: 'CRN123',
      submission: {
        id: 'submission-id',
        localAuthority: { localAuthorityAreaId: 'la-id', localAuthorityAreaName: 'Some Council' },
        referenceNumber: 'REF123',
        submissionDate: '2025-06-15',
        createdBy: 'user1',
        createdAt: '2025-06-15T00:00:00.000Z',
      },
    })

    beforeEach(() => {
      dutyToReferService.getDutyToRefer.mockResolvedValue(dtr)
      request = mock<Request>({
        params: { crn: 'CRN123' },
        body: { outcomeStatus: 'ACCEPTED' },
        flash: jest.fn(),
      })
    })

    it('updates and redirects to the case page', async () => {
      jest.spyOn(dutyToReferUtils, 'validateOutcome').mockReturnValue(true)

      await controller.saveOutcome()(request, response, next)

      expect(dutyToReferService.update).toHaveBeenCalledWith('token-1', 'CRN123', 'submission-id', {
        status: 'ACCEPTED',
        submissionDate: '2025-06-15',
        localAuthorityAreaId: 'la-id',
        referenceNumber: 'REF123',
      })
      expect(request.flash).toHaveBeenCalledWith('success', 'Outcome details added')
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.cases.show({ crn: 'CRN123' }))
    })

    it('redirects back when validation fails', async () => {
      jest.spyOn(dutyToReferUtils, 'validateOutcome').mockReturnValue(false)

      await controller.saveOutcome()(request, response, next)

      expect(dutyToReferService.update).not.toHaveBeenCalled()
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.dutyToRefer.outcome({ crn: 'CRN123' }))
    })

    it('keeps edit flow when outcome validation fails', async () => {
      jest.spyOn(dutyToReferUtils, 'validateOutcome').mockReturnValue(false)
      request.query = { flow: 'edit' }

      await controller.saveOutcome()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(`${uiPaths.dutyToRefer.outcome({ crn: 'CRN123' })}?flow=edit`)
    })

    it('redirects back when the API call fails', async () => {
      jest.spyOn(dutyToReferUtils, 'validateOutcome').mockReturnValue(true)
      dutyToReferService.update.mockRejectedValueOnce(new Error('API error'))

      await controller.saveOutcome()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(uiPaths.dutyToRefer.outcome({ crn: 'CRN123' }))
    })

    it('keeps edit flow when outcome update fails', async () => {
      jest.spyOn(dutyToReferUtils, 'validateOutcome').mockReturnValue(true)
      request.query = { flow: 'edit' }
      dutyToReferService.update.mockRejectedValueOnce(new Error('API error'))

      await controller.saveOutcome()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(`${uiPaths.dutyToRefer.outcome({ crn: 'CRN123' })}?flow=edit`)
    })
  })

  describe('show', () => {
    it('renders the duty to refer details page', async () => {
      const crn = 'CRN123'
      const dutyToRefer = dutyToReferFactory.notStarted().build({ crn })

      dutyToReferService.getDutyToRefer.mockResolvedValue(dutyToRefer)

      await controller.show()(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.DUTY_TO_REFER_DETAILS, {
        who: 'user1',
        correlationId: 'request-id',
      })

      expect(response.render).toHaveBeenCalledWith('pages/duty-to-refer/show', {
        crn,
        caseData,
        assignedTo: caseAssignedTo(caseData, 'user-id'),
        submissionDetailRows: detailsSummaryListRows(dutyToRefer),
        outcomeDetailRows: outcomeDetailsSummaryListRows(dutyToRefer),
        status: dutyToRefer?.status,
      })
    })
  })
})
