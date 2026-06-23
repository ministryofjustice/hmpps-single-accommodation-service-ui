import { NextFunction, Request, Response } from 'express'
import { mock } from 'jest-mock-extended'
import DutyToReferController, { SubmissionFlow } from './dutyToReferController'
import AuditService, { Page } from '../services/auditService'
import DutyToReferService from '../services/dutyToReferService'
import CasesService from '../services/casesService'
import ReferenceDataService from '../services/referenceDataService'
import uiPaths from '../paths/ui'
import * as dutyToReferUtils from '../utils/dutyToRefer'
import {
  detailsSummaryListRows,
  dutyToReferTimelineEntry,
  outcomeDetailsSummaryListRows,
  outcomeReasonLabels,
  summaryListRows,
  withdrawReasonLabels,
} from '../utils/dutyToRefer'
import * as validationUtils from '../utils/validation'
import {
  apiResponseFactory,
  auditRecordFactory,
  caseFactory,
  dtrSubmissionFactory,
  dutyToReferFactory,
  referenceDataFactory,
} from '../testutils/factories'
import { caseAssignedTo } from '../utils/cases'
import { radioItems } from '../utils/utils'

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

    casesService.getCase.mockResolvedValue(apiResponseFactory.case(caseData))
    referenceDataService.getLocalAuthorities.mockResolvedValue(apiResponseFactory.referenceData(localAuthorities))

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

    jest.spyOn(validationUtils, 'validateAndFlashErrors')
    jest.spyOn(validationUtils, 'addGenericErrorToFlash')
    jest.spyOn(validationUtils, 'addUserInputToFlash')
  })

  describe('submission', () => {
    it('renders the submission page for a first referral', async () => {
      await controller.submission('add')(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.DUTY_TO_REFER_SUBMISSION, {
        who: 'user1',
        correlationId: 'request-id',
      })
      expect(casesService.getCase).toHaveBeenCalledWith('token-1', 'CRN123')
      expect(referenceDataService.getLocalAuthorities).toHaveBeenCalledWith('token-1')
      expect(response.render).toHaveBeenCalledWith('pages/duty-to-refer/submission', {
        pageTitle: 'Add Duty to Refer (DTR) referral details',
        backLinkHref: '/cases/CRN123',
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

      await controller.submission('add')(request, response, next)

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
      request.params.id = 'submission-id'

      await controller.submission('edit')(request, response, next)

      expect(response.render).toHaveBeenCalledWith(
        'pages/duty-to-refer/submission',
        expect.objectContaining({
          pageTitle: 'Edit Duty to Refer (DTR) referral details',
          backLinkHref: '/cases/CRN123/dtr/submission-id/details',
        }),
      )
    })

    it('renders the submission page for a new referral', async () => {
      await controller.submission('addNew')(request, response, next)

      expect(response.render).toHaveBeenCalledWith(
        'pages/duty-to-refer/submission',
        expect.objectContaining({
          pageTitle: 'Add new Duty to Refer (DTR) referral details',
          backLinkHref: '/cases/CRN123',
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
          submissionNote: '',
        },
        flash: jest.fn(),
      })
    })

    it('submits and redirects to the case details page', async () => {
      const dtr = dutyToReferFactory.submitted().build({ crn: 'CRN123' })
      dutyToReferService.submit.mockResolvedValue(dtr)
      request.body.submissionNote = 'This is a note'

      await controller.saveSubmission('add')(request, response, next)

      expect(dutyToReferService.submit).toHaveBeenCalledWith('token-1', 'CRN123', {
        status: 'SUBMITTED',
        submissionDate: '2025-06-15',
        localAuthorityAreaId: 'la-id',
        referenceNumber: 'REF123',
        submissionNote: 'This is a note',
      })
      expect(casesService.getCase).not.toHaveBeenCalled()
      expect(request.flash).toHaveBeenCalledWith('success', 'New DTR referral details added')
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.cases.show({ crn: 'CRN123' }))
    })

    it('updates and redirects to the DTR details page when editing', async () => {
      const dutyToRefer = dutyToReferFactory.submitted().build({ crn: 'CRN123' })
      const expectedRedirect = uiPaths.dutyToRefer.show({ crn: 'CRN123', id: dutyToRefer.submission.id })
      dutyToReferService.getDtrBySubmissionId.mockResolvedValue(apiResponseFactory.dutyToRefer(dutyToRefer))

      request.params.id = dutyToRefer.submission.id

      await controller.saveSubmission('edit')(request, response, next)

      expect(dutyToReferService.update).toHaveBeenCalledWith('token-1', 'CRN123', dutyToRefer.submission.id, {
        status: 'SUBMITTED',
        submissionDate: '2025-06-15',
        localAuthorityAreaId: 'la-id',
        referenceNumber: 'REF123',
        submissionNote: null,
      })
      expect(casesService.getCase).not.toHaveBeenCalled()
      expect(request.flash).toHaveBeenCalledWith('success', 'Submission details updated')
      expect(response.redirect).toHaveBeenCalledWith(expectedRedirect)
    })

    it('keeps submission status when editing an existing submission that has an outcome', async () => {
      const submission = dtrSubmissionFactory.accepted().build({ outcomeNote: 'This is an outcome note' })
      const dutyToRefer = dutyToReferFactory.accepted().build({ crn: 'CRN123', submission })
      const outcomeReason = dutyToRefer.submission?.outcomeReason
      const expectedRedirect = uiPaths.dutyToRefer.show({ crn: 'CRN123', id: dutyToRefer.submission.id })
      dutyToReferService.getDtrBySubmissionId.mockResolvedValue(apiResponseFactory.dutyToRefer(dutyToRefer))

      request.params.id = dutyToRefer.submission.id

      await controller.saveSubmission('edit')(request, response, next)

      expect(dutyToReferService.update).toHaveBeenCalledWith('token-1', 'CRN123', dutyToRefer.submission.id, {
        status: 'ACCEPTED',
        submissionDate: '2025-06-15',
        localAuthorityAreaId: 'la-id',
        referenceNumber: 'REF123',
        outcomeReason,
        submissionNote: null,
        outcomeNote: 'This is an outcome note',
      })
      expect(casesService.getCase).not.toHaveBeenCalled()
      expect(request.flash).toHaveBeenCalledWith('success', 'Submission details updated')
      expect(response.redirect).toHaveBeenCalledWith(expectedRedirect)
    })

    it('saves and redirects to the case details page when adding a new submission', async () => {
      const dtr = dutyToReferFactory.submitted().build({ crn: 'CRN123' })
      dutyToReferService.submit.mockResolvedValue(dtr)

      await controller.saveSubmission('addNew')(request, response, next)

      expect(dutyToReferService.submit).toHaveBeenCalledWith('token-1', 'CRN123', {
        status: 'SUBMITTED',
        submissionDate: '2025-06-15',
        localAuthorityAreaId: 'la-id',
        referenceNumber: 'REF123',
        submissionNote: null,
      })
      expect(casesService.getCase).toHaveBeenCalledWith('token-1', 'CRN123')
      expect(request.flash).toHaveBeenCalledWith('success', {
        heading: 'New DTR referral details added',
        body: "<p>The previous referral has been moved to James Smith's referral history</p>",
      })
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.cases.show({ crn: 'CRN123' }))
    })

    describe.each([
      [
        'when editing an existing submission',
        'edit',
        { id: 'submission-id' },
        uiPaths.dutyToRefer.edit({ crn: 'CRN123', id: 'submission-id' }),
      ],
      [
        'when adding a submission for the first time',
        'add',
        { id: undefined },
        uiPaths.dutyToRefer.submission({ crn: 'CRN123' }),
      ],
      [
        'when adding a new submission',
        'addNew',
        { id: undefined },
        uiPaths.dutyToRefer.newSubmission({ crn: 'CRN123' }),
      ],
    ])('%s', (_, flow: SubmissionFlow, params, errorRedirect) => {
      beforeEach(() => {
        request.params.id = params.id
      })

      it('redirects to submission page when validation fails', async () => {
        jest.spyOn(dutyToReferUtils, 'validateSubmission').mockReturnValue(false)

        await controller.saveSubmission(flow)(request, response, next)

        expect(dutyToReferService.submit).not.toHaveBeenCalled()
        expect(response.redirect).toHaveBeenCalledWith(errorRedirect)
      })

      it('redirects to submission page when the API call fails', async () => {
        dutyToReferService.submit.mockRejectedValue(new Error('API error'))
        dutyToReferService.update.mockRejectedValue(new Error('API error'))

        await controller.saveSubmission(flow)(request, response, next)

        expect(response.redirect).toHaveBeenCalledWith(errorRedirect)
      })
    })
  })

  describe('outcome', () => {
    beforeEach(() => {
      request.params.id = 'existing-submission-id'
    })

    it('renders the outcome page', async () => {
      const dtr = dutyToReferFactory.submitted().build({ crn: 'CRN123' })
      dutyToReferService.getDtrBySubmissionId.mockResolvedValue(apiResponseFactory.dutyToRefer(dtr))

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
        pageTitle: 'Add Duty to Refer (DTR) outcome',
        backLinkHref: '/cases/CRN123/dtr/existing-submission-id/details',
        crn: 'CRN123',
        dtr,
        tableRows: summaryListRows(caseData, dtr),
        outcomeItems: radioItems(outcomeReasonLabels),
        errors: {},
        errorSummary: [],
      })
    })

    it('renders the outcome page when editing an outcome', async () => {
      const dtr = dutyToReferFactory.accepted().build({ crn: 'CRN123' })
      dutyToReferService.getDtrBySubmissionId.mockResolvedValue(apiResponseFactory.dutyToRefer(dtr))

      await controller.outcome()(request, response, next)

      expect(response.render).toHaveBeenCalledWith(
        'pages/duty-to-refer/outcome',
        expect.objectContaining({
          pageTitle: 'Edit Duty to Refer (DTR) outcome',
          backLinkHref: '/cases/CRN123/dtr/existing-submission-id/details',
        }),
      )
    })
  })

  describe('saveOutcome', () => {
    beforeEach(() => {
      dutyToReferService.update.mockResolvedValue()
      request = mock<Request>({
        params: { crn: 'CRN123', id: 'submission-id' },
        body: {
          outcomeReason: 'PREVENTION_AND_RELIEF_DUTY',
          submissionDate: '2025-06-15',
          localAuthorityAreaId: 'la-id',
          referenceNumber: 'REF123',
          currentStatus: 'SUBMITTED',
          submissionNote: '',
          outcomeNote: '',
        },
        flash: jest.fn(),
      })
    })

    it('saves the outcome and redirects to the details page', async () => {
      await controller.saveOutcome()(request, response, next)

      expect(dutyToReferService.update).toHaveBeenCalledWith('token-1', 'CRN123', 'submission-id', {
        status: 'ACCEPTED',
        outcomeReason: 'PREVENTION_AND_RELIEF_DUTY',
        submissionDate: '2025-06-15',
        localAuthorityAreaId: 'la-id',
        referenceNumber: 'REF123',
        submissionNote: null,
        outcomeNote: null,
      })
      expect(request.flash).toHaveBeenCalledWith('success', 'Outcome details added')
      expect(response.redirect).toHaveBeenCalledWith('/cases/CRN123/dtr/submission-id/details')
    })

    it('updates an existing outcome and redirects to the details page', async () => {
      request.body.currentStatus = 'NOT_ACCEPTED'
      request.body.outcomeNote = 'Some note'

      await controller.saveOutcome()(request, response, next)

      expect(dutyToReferService.update).toHaveBeenCalledWith('token-1', 'CRN123', 'submission-id', {
        status: 'ACCEPTED',
        outcomeReason: 'PREVENTION_AND_RELIEF_DUTY',
        submissionDate: '2025-06-15',
        localAuthorityAreaId: 'la-id',
        referenceNumber: 'REF123',
        submissionNote: null,
        outcomeNote: 'Some note',
      })
      expect(request.flash).toHaveBeenCalledWith('success', 'Outcome details updated')
      expect(response.redirect).toHaveBeenCalledWith('/cases/CRN123/dtr/submission-id/details')
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
    const crn = 'CRN123'
    const auditRecords = auditRecordFactory.buildList(2)
    const dutyToRefer = dutyToReferFactory.submitted().build({ crn })

    beforeEach(() => {
      request.params.id = 'submission-id'
      dutyToReferService.getTimeline.mockResolvedValue(apiResponseFactory.auditRecords(auditRecords))
      dutyToReferService.getDtrBySubmissionId.mockResolvedValue(apiResponseFactory.dutyToRefer(dutyToRefer))
    })

    it('renders the duty to refer details page', async () => {
      await controller.show()(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.DUTY_TO_REFER_DETAILS, {
        who: 'user1',
        correlationId: 'request-id',
      })

      expect(response.render).toHaveBeenCalledWith('pages/duty-to-refer/show', {
        crn,
        dtrId: 'submission-id',
        caseData,
        timeline: auditRecords.map(dutyToReferTimelineEntry),
        assignedTo: caseAssignedTo(caseData, 'user1'),
        submissionDetailRows: detailsSummaryListRows(dutyToRefer),
        outcomeDetailRows: outcomeDetailsSummaryListRows(dutyToRefer),
        status: dutyToRefer?.status,
        errors: {},
        errorSummary: [],
      })
    })

    it('shows errors', async () => {
      const userInput = { note: '' }
      const errors = { note: 'Enter a note' }
      const errorSummary = [{ href: '#note', text: 'Enter a note' }]

      jest.spyOn(validationUtils, 'fetchErrorsAndUserInput').mockReturnValue({ errors, errorSummary, userInput })

      await controller.show()(request, response, next)

      expect(response.render).toHaveBeenCalledWith(
        'pages/duty-to-refer/show',
        expect.objectContaining({
          errors,
          errorSummary,
          note: userInput.note,
        }),
      )
    })
  })

  describe('saveNote', () => {
    beforeEach(() => {
      request.params.id = 'submission-id'
    })

    it('redirects with an error if the note is empty', async () => {
      request.body = { note: '' }

      await controller.saveNote()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(uiPaths.dutyToRefer.show({ crn: 'CRN123', id: 'submission-id' }))
      expect(validationUtils.validateAndFlashErrors).toHaveBeenCalledWith(request, {
        note: 'Enter a note',
      })
    })

    it('redirects with an error if the API returns an error', async () => {
      dutyToReferService.submitTimelineNote.mockRejectedValue(new Error('API error'))

      request.body = { note: 'Some valid note' }

      await controller.saveNote()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(uiPaths.dutyToRefer.show({ crn: 'CRN123', id: 'submission-id' }))
      expect(validationUtils.addGenericErrorToFlash).toHaveBeenCalledWith(request, 'API error')
      expect(validationUtils.addUserInputToFlash).toHaveBeenCalledWith(request)
    })

    it('saves the note and redirects to the duty to refer details page with a success message', async () => {
      dutyToReferService.submitTimelineNote.mockResolvedValue()

      request.body = { note: 'Some valid note' }

      await controller.saveNote()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(uiPaths.dutyToRefer.show({ crn: 'CRN123', id: 'submission-id' }))
      expect(request.flash).toHaveBeenCalledWith('success', 'Note added')
      expect(dutyToReferService.submitTimelineNote).toHaveBeenCalledWith('token-1', 'CRN123', 'submission-id', {
        note: 'Some valid note',
      })
    })
  })

  describe('withdraw', () => {
    beforeEach(() => {
      request.params.id = 'submission-id'
    })

    it('renders the withdraw page', async () => {
      const dtr = dutyToReferFactory.submitted().build({ crn: 'CRN123' })
      dutyToReferService.getDtrBySubmissionId.mockResolvedValue(apiResponseFactory.dutyToRefer(dtr))

      await controller.withdraw()(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.DUTY_TO_REFER_WITHDRAW, {
        who: 'user1',
        correlationId: 'request-id',
      })
      expect(casesService.getCase).toHaveBeenCalledWith('token-1', 'CRN123')
      expect(dutyToReferService.getDtrBySubmissionId).toHaveBeenCalledWith('token-1', 'CRN123', 'submission-id')
      expect(response.render).toHaveBeenCalledWith('pages/duty-to-refer/withdraw', {
        pageTitle: 'Withdraw referral',
        backLinkHref: '/cases/CRN123/dtr/submission-id/details',
        crn: 'CRN123',
        dtr,
        tableRows: summaryListRows(caseData, dtr),
        withdrawalReasonItems: radioItems(withdrawReasonLabels),
        errors: {},
        errorSummary: [],
      })
    })

    it('renders the withdraw page with errors and user input', async () => {
      const dtr = dutyToReferFactory.submitted().build({ crn: 'CRN123' })
      dutyToReferService.getDtrBySubmissionId.mockResolvedValue(apiResponseFactory.dutyToRefer(dtr))

      const userInput = { withdrawalReason: 'OTHER', withdrawalReasonOther: '' }
      jest.spyOn(validationUtils, 'fetchErrorsAndUserInput').mockReturnValue({
        errors: { withdrawalReasonOther: { text: 'Enter other reason for withdrawal' } },
        errorSummary: [{ text: 'Enter other reason for withdrawal', href: '#withdrawalReasonOther' }],
        userInput,
      })

      await controller.withdraw()(request, response, next)

      expect(response.render).toHaveBeenCalledWith(
        'pages/duty-to-refer/withdraw',
        expect.objectContaining({
          withdrawalReasonItems: radioItems(withdrawReasonLabels, 'OTHER'),
          withdrawalReason: 'OTHER',
          withdrawalReasonOther: '',
          errors: { withdrawalReasonOther: { text: 'Enter other reason for withdrawal' } },
        }),
      )
    })
  })

  describe('saveWithdrawal', () => {
    beforeEach(() => {
      dutyToReferService.update.mockResolvedValue()
      request = mock<Request>({
        params: { crn: 'CRN123', id: 'submission-id' },
        body: {
          submissionDate: '2025-06-15',
          localAuthorityAreaId: 'la-id',
          referenceNumber: 'REF123',
          withdrawalReason: 'NO_CONSENT',
          withdrawalReasonOther: '',
          submissionNote: '',
          outcomeReason: '',
          outcomeNote: '',
        },
        flash: jest.fn(),
      })
    })

    it('saves the withdrawal and redirects to the case page', async () => {
      await controller.saveWithdrawal()(request, response, next)

      expect(dutyToReferService.update).toHaveBeenCalledWith('token-1', 'CRN123', 'submission-id', {
        status: 'WITHDRAWN',
        submissionDate: '2025-06-15',
        localAuthorityAreaId: 'la-id',
        referenceNumber: 'REF123',
        withdrawalReason: 'NO_CONSENT',
        withdrawalReasonOther: null,
        submissionNote: null,
      })
      expect(request.flash).toHaveBeenCalledWith('success', 'DTR referral withdrawn')
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.cases.show({ crn: 'CRN123' }))
    })

    it('saves with OTHER reason and withdrawal reason text', async () => {
      request.body.withdrawalReason = 'OTHER'
      request.body.withdrawalReasonOther = 'Some reason'

      await controller.saveWithdrawal()(request, response, next)

      expect(dutyToReferService.update).toHaveBeenCalledWith(
        'token-1',
        'CRN123',
        'submission-id',
        expect.objectContaining({
          status: 'WITHDRAWN',
          withdrawalReason: 'OTHER',
          withdrawalReasonOther: 'Some reason',
        }),
      )
      expect(request.flash).toHaveBeenCalledWith('success', 'DTR referral withdrawn')
    })

    it('redirects back when validation fails', async () => {
      jest.spyOn(dutyToReferUtils, 'validateWithdraw').mockReturnValue(false)

      await controller.saveWithdrawal()(request, response, next)

      expect(dutyToReferService.update).not.toHaveBeenCalled()
      expect(response.redirect).toHaveBeenCalledWith(
        uiPaths.dutyToRefer.withdraw({ crn: 'CRN123', id: 'submission-id' }),
      )
    })

    it('redirects back when the API call fails', async () => {
      dutyToReferService.update.mockRejectedValueOnce(new Error('API error'))

      await controller.saveWithdrawal()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(
        uiPaths.dutyToRefer.withdraw({ crn: 'CRN123', id: 'submission-id' }),
      )
    })
  })
})
