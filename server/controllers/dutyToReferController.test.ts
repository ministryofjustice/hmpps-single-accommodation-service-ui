import { NextFunction, Request, Response } from 'express'
import { mock } from 'jest-mock-extended'
import DutyToReferController from './dutyToReferController'
import AuditService, { Page } from '../services/auditService'
import DutyToReferService from '../services/dutyToReferService'
import CasesService from '../services/casesService'
import ReferenceDataService from '../services/referenceDataService'
import uiPaths from '../paths/ui'
import * as dutyToReferUtils from '../utils/dutyToRefer'
import { detailsSummaryListRows, outcomeDetailsSummaryListRows, summaryListRows } from '../utils/dutyToRefer'
import * as validationUtils from '../utils/validation'
import { caseFactory, dutyToReferFactory, referenceDataFactory } from '../testutils/factories'
import { caseAssignedTo } from '../utils/cases'
import * as backlinksUtils from '../utils/backlinks'

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
    jest.clearAllMocks()

    casesService.getCase.mockResolvedValue(caseData)
    referenceDataService.getLocalAuthorities.mockResolvedValue(localAuthorities)

    request = mock<Request>({
      id: 'request-id',
      params: { crn: 'CRN123', id: undefined },
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
      await controller.submission()(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.DUTY_TO_REFER_SUBMISSION, {
        who: 'user1',
        correlationId: 'request-id',
      })
      expect(casesService.getCase).toHaveBeenCalledWith('token-1', 'CRN123')
      expect(referenceDataService.getLocalAuthorities).toHaveBeenCalledWith('token-1')
      expect(response.render).toHaveBeenCalledWith('pages/duty-to-refer/submission', {
        pageTitle: 'Add Duty to Refer (DTR) submission details',
        backLinkHref: '/cases/CRN123/dtr/guidance',
        crn: 'CRN123',
        tableRows: summaryListRows(caseData),
        localAuthorities,
        errors: {},
        errorSummary: [],
        formValues: {},
      })
    })

    it('renders the submission page with errors and user input', async () => {
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

      expect(response.render).toHaveBeenCalledWith(
        'pages/duty-to-refer/submission',
        expect.objectContaining({
          errors: { localAuthorityAreaId: { text: 'Select a local authority' } },
          errorSummary: [{ text: 'Select a local authority', href: '#localAuthorityAreaId' }],
          formValues: userInput,
        }),
      )
    })

    it('renders the submission page to edit a submission', async () => {
      jest.spyOn(backlinksUtils, 'setFlowRedirect').mockReturnValue('/cases/X456123/dtr/submission-id/details')

      request.params.id = 'submission-id'

      await controller.submission()(request, response, next)

      expect(response.render).toHaveBeenCalledWith(
        'pages/duty-to-refer/submission',
        expect.objectContaining({
          pageTitle: 'Edit Duty to Refer (DTR) submission details',
          backLinkHref: '/cases/X456123/dtr/submission-id/details',
        }),
      )
    })
  })

  describe('saveSubmission', () => {
    beforeEach(() => {
      request = mock<Request>({
        params: { crn: 'CRN123', id: undefined },
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

    it('updates and redirects to the flow redirect page when editing', async () => {
      const dutyToRefer = dutyToReferFactory.submitted().build({ crn: 'CRN123' })
      const expectedRedirect = uiPaths.dutyToRefer.show({ crn: 'CRN123', id: dutyToRefer.submission.id })
      jest.spyOn(backlinksUtils, 'getFlowRedirect').mockReturnValue(expectedRedirect)

      request.params.id = dutyToRefer.submission.id

      await controller.saveSubmission()(request, response, next)

      expect(dutyToReferService.update).toHaveBeenCalledWith('token-1', 'CRN123', dutyToRefer.submission.id, {
        status: 'SUBMITTED',
        submissionDate: '2025-06-15',
        localAuthorityAreaId: 'la-id',
        referenceNumber: 'REF123',
      })

      expect(request.flash).toHaveBeenCalledWith('success', 'Submission details updated')
      expect(response.redirect).toHaveBeenCalledWith(expectedRedirect)
    })

    describe.each([
      ['when editing', { id: 'submission-id' }, uiPaths.dutyToRefer.edit({ crn: 'CRN123', id: 'submission-id' })],
      ['when adding', { id: undefined }, uiPaths.dutyToRefer.submission({ crn: 'CRN123' })],
    ])('%s a submission', (_, params, errorRedirect) => {
      beforeEach(() => {
        request.params.id = params.id
      })

      it('redirects to submission page when validation fails', async () => {
        jest.spyOn(dutyToReferUtils, 'validateSubmission').mockReturnValue(false)

        await controller.saveSubmission()(request, response, next)

        expect(dutyToReferService.submit).not.toHaveBeenCalled()
        expect(response.redirect).toHaveBeenCalledWith(errorRedirect)
      })

      it('redirects to submission page when the API call fails', async () => {
        dutyToReferService.submit.mockRejectedValue(new Error('API error'))
        dutyToReferService.update.mockRejectedValue(new Error('API error'))

        await controller.saveSubmission()(request, response, next)

        expect(response.redirect).toHaveBeenCalledWith(errorRedirect)
      })
    })
  })

  describe('outcome', () => {
    beforeEach(() => {
      request.params.id = 'existing-submission-id'
    })

    it('renders the outcome page', async () => {
      jest.spyOn(backlinksUtils, 'setFlowRedirect').mockReturnValue('/cases/CRN123')
      const dtr = dutyToReferFactory.submitted().build({ crn: 'CRN123' })
      dutyToReferService.getDtrBySubmissionId.mockResolvedValue(dtr)

      await controller.outcome()(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.DUTY_TO_REFER_OUTCOME, {
        who: 'user1',
        correlationId: 'request-id',
      })
      expect(casesService.getCase).toHaveBeenCalledWith('token-1', 'CRN123')
      expect(dutyToReferService.getDtrBySubmissionId).toHaveBeenCalledWith(
        'token-1',
        'CRN123',
        'existing-submission-id',
      )
      expect(response.render).toHaveBeenCalledWith('pages/duty-to-refer/outcome', {
        pageTitle: 'Add Duty to Refer (DTR) outcome details',
        backLinkHref: '/cases/CRN123',
        crn: 'CRN123',
        tableRows: summaryListRows(caseData, dtr),
        errors: {},
        errorSummary: [],
      })
    })

    it('renders the outcome page when editing an outcome', async () => {
      jest.spyOn(backlinksUtils, 'setFlowRedirect').mockReturnValue('/cases/CRN123/dtr/existing-submission-id/details')
      const dtr = dutyToReferFactory.accepted().build({ crn: 'CRN123' })
      dutyToReferService.getDtrBySubmissionId.mockResolvedValue(dtr)

      await controller.outcome()(request, response, next)

      expect(response.render).toHaveBeenCalledWith(
        'pages/duty-to-refer/outcome',
        expect.objectContaining({
          pageTitle: 'Edit Duty to Refer (DTR) outcome details',
          backLinkHref: '/cases/CRN123/dtr/existing-submission-id/details',
        }),
      )
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
      dutyToReferService.getDtrBySubmissionId.mockResolvedValue(dtr)
      dutyToReferService.update.mockResolvedValue()
      request = mock<Request>({
        params: { crn: 'CRN123', id: 'submission-id' },
        body: { outcomeStatus: 'ACCEPTED' },
        flash: jest.fn(),
      })
    })

    it('saves the outcome and redirects to the flow redirect page', async () => {
      jest.spyOn(backlinksUtils, 'getFlowRedirect').mockReturnValue('/some-redirect')

      await controller.saveOutcome()(request, response, next)

      expect(dutyToReferService.update).toHaveBeenCalledWith('token-1', 'CRN123', 'submission-id', {
        status: 'ACCEPTED',
        submissionDate: '2025-06-15',
        localAuthorityAreaId: 'la-id',
        referenceNumber: 'REF123',
      })
      expect(request.flash).toHaveBeenCalledWith('success', 'Outcome details added')
      expect(response.redirect).toHaveBeenCalledWith('/some-redirect')
    })

    it('updates an existing outcome and redirects to the flow redirect page', async () => {
      jest.spyOn(backlinksUtils, 'getFlowRedirect').mockReturnValue('/some-other-redirect')

      const dtrWithOutcome = dutyToReferFactory.build({ ...dtr, status: 'NOT_ACCEPTED' })
      dutyToReferService.getDtrBySubmissionId.mockResolvedValue(dtrWithOutcome)

      await controller.saveOutcome()(request, response, next)

      expect(dutyToReferService.update).toHaveBeenCalledWith('token-1', 'CRN123', 'submission-id', {
        status: 'ACCEPTED',
        submissionDate: '2025-06-15',
        localAuthorityAreaId: 'la-id',
        referenceNumber: 'REF123',
      })
      expect(request.flash).toHaveBeenCalledWith('success', 'Outcome details updated')
      expect(response.redirect).toHaveBeenCalledWith('/some-other-redirect')
    })

    it('redirects back when validation fails', async () => {
      jest.spyOn(dutyToReferUtils, 'validateOutcome').mockReturnValue(false)

      await controller.saveOutcome()(request, response, next)

      expect(dutyToReferService.update).not.toHaveBeenCalled()
      expect(response.redirect).toHaveBeenCalledWith(
        uiPaths.dutyToRefer.outcome({ crn: 'CRN123', id: 'submission-id' }),
      )
    })

    it('redirects back when the API call fails', async () => {
      jest.spyOn(dutyToReferUtils, 'validateOutcome').mockReturnValue(true)
      dutyToReferService.update.mockRejectedValueOnce(new Error('API error'))

      await controller.saveOutcome()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(
        uiPaths.dutyToRefer.outcome({ crn: 'CRN123', id: 'submission-id' }),
      )
    })
  })

  describe('show', () => {
    it('renders the duty to refer details page', async () => {
      const crn = 'CRN123'
      const dutyToRefer = dutyToReferFactory.submitted().build({ crn })

      request.params.id = 'submission-id'

      dutyToReferService.getDtrBySubmissionId.mockResolvedValue(dutyToRefer)

      await controller.show()(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.DUTY_TO_REFER_DETAILS, {
        who: 'user1',
        correlationId: 'request-id',
      })

      expect(response.render).toHaveBeenCalledWith('pages/duty-to-refer/show', {
        crn,
        dtrId: 'submission-id',
        caseData,
        assignedTo: caseAssignedTo(caseData, 'user-id'),
        submissionDetailRows: detailsSummaryListRows(dutyToRefer),
        outcomeDetailRows: outcomeDetailsSummaryListRows(dutyToRefer),
        status: dutyToRefer?.status,
      })
    })
  })
})
