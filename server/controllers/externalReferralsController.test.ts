import { NextFunction, Request, Response } from 'express'
import { mock } from 'jest-mock-extended'
import { TimelineEntry } from '@govuk/ui'
import AuditService, { Page } from '../services/auditService'
import * as validationUtils from '../utils/validation'
import CasesService from '../services/casesService'
import ExternalReferralsController from './externalReferralsController'
import { apiResponseFactory, auditRecordFactory, caseFactory, externalReferralFactory } from '../testutils/factories'
import ExternalReferralsService from '../services/externalReferralsService'
import uiPaths from '../paths/ui'

import * as utils from '../utils/externalReferrals'
import { breadcrumbs } from '../utils/breadcrumbs'
import { caseAssignedTo, displayName } from '../utils/cases'
import {
  detailsSummaryListRows,
  summaryListRows,
  outcomeDetailsSummaryListRows,
  withdrawalReasonRadios,
} from '../utils/externalReferrals'

describe('ExternalReferralsController', () => {
  const id = '123'
  const crn = 'CRN123'
  const token = 'token-1'

  let request: Request
  const response = mock<Response>({ locals: { user: { username: 'user1', token } } })
  const next = mock<NextFunction>()

  const auditService = mock<AuditService>()
  const casesService = mock<CasesService>()
  const externalReferralsService = mock<ExternalReferralsService>()

  const caseData = caseFactory.build({
    forename: 'James',
    surname: 'Smith',
    crn,
  })

  const timeLine = auditRecordFactory.buildList(2)
  const submittedReferral = externalReferralFactory.submitted().build({ crn })

  const casePagePath = uiPaths.cases.show({ crn })
  const detailsPagePath = uiPaths.externalReferrals.show({ crn, id })
  const outcomePagePath = uiPaths.externalReferrals.outcome({ crn, id })
  const withdrawalPagePath = uiPaths.externalReferrals.withdrawal({ crn, id })
  const submissionPagePath = uiPaths.externalReferrals.submission({ crn })

  let controller: ExternalReferralsController

  beforeEach(() => {
    jest.clearAllMocks()

    casesService.getCase.mockResolvedValue(apiResponseFactory.case(caseData))
    externalReferralsService.getExternalReferralBySubmissionId.mockResolvedValue(
      apiResponseFactory.externalReferral(submittedReferral),
    )

    request = mock<Request>({
      id: 'request-id',
      params: { crn, id: undefined },
      body: {},
      flash: jest.fn(),
    })

    controller = new ExternalReferralsController(auditService, externalReferralsService, casesService)
    jest
      .spyOn(validationUtils, 'fetchErrorsAndUserInput')
      .mockReturnValue({ errors: {}, errorSummary: [], userInput: {} })

    jest.spyOn(validationUtils, 'validateAndFlashErrors')
    jest.spyOn(validationUtils, 'addGenericErrorToFlash')
    jest.spyOn(validationUtils, 'addUserInputToFlash')
    jest.spyOn(utils, 'externalReferralTimelineEntry').mockReturnValue({} as TimelineEntry)
  })

  afterEach(() => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
  })

  describe('show', () => {
    beforeEach(() => {
      request.params.id = id
      externalReferralsService.getTimeline.mockResolvedValue(apiResponseFactory.auditRecords(timeLine))
    })

    it('renders the referral details page', async () => {
      await controller.show()(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.EXTERNAL_REFERRALS_DETAILS, {
        who: 'user1',
        correlationId: 'request-id',
      })

      expect(utils.externalReferralTimelineEntry).toHaveBeenCalledWith(timeLine[1], 'user1')

      expect(response.render).toHaveBeenCalledWith('pages/external-referrals/show', {
        breadcrumbs: breadcrumbs(request, caseData),
        crn,
        referralId: id,
        displayName: displayName(caseData),
        caseData,
        assignedTo: caseAssignedTo(caseData, 'user1'),
        referral: submittedReferral,
        submissionDetailRows: detailsSummaryListRows(submittedReferral),
        status: submittedReferral.status,
        timeline: [{}, {}],
        editPath: uiPaths.externalReferrals.edit({ crn, id }),
        outcomePath: outcomePagePath,
        withdrawalPath: withdrawalPagePath,
        outcomeDetailRows: [],
        errors: {},
        errorSummary: [],
      })
    })

    it.each([
      ['accepted', externalReferralFactory.accepted().build({ crn })],
      ['rejected', externalReferralFactory.rejected().build({ crn })],
    ])('renders the outcome details for an %s referral', async (_, referral) => {
      externalReferralsService.getExternalReferralBySubmissionId.mockResolvedValue(
        apiResponseFactory.externalReferral(referral),
      )
      await controller.show()(request, response, next)

      expect(response.render).toHaveBeenCalledWith(
        'pages/external-referrals/show',
        expect.objectContaining({
          submissionDetailRows: detailsSummaryListRows(referral),
          status: referral.status,
          outcomeDetailRows: outcomeDetailsSummaryListRows(referral),
        }),
      )
    })

    it('shows errors', async () => {
      const userInput = { organisationName: '' }
      const errors = { organisationName: 'Enter organisation' }
      const errorSummary = [{ href: '#organisationName', text: 'Enter organisation' }]

      jest.spyOn(validationUtils, 'fetchErrorsAndUserInput').mockReturnValue({ errors, errorSummary, userInput })

      await controller.show()(request, response, next)

      expect(response.render).toHaveBeenCalledWith(
        'pages/external-referrals/show',
        expect.objectContaining({
          errors,
          errorSummary,
        }),
      )
    })
  })

  describe('submission', () => {
    it('renders the submission page for a first referral', async () => {
      await controller.submission('add')(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.EXTERNAL_REFERRALS_SUBMISSION, {
        who: 'user1',
        correlationId: 'request-id',
      })
      expect(casesService.getCase).toHaveBeenCalledWith(token, crn)
      expect(response.render).toHaveBeenCalledWith('pages/external-referrals/submission', {
        pageTitle: 'Add external referral details',
        backLinkHref: casePagePath,
        crn,
        tableRows: summaryListRows(caseData),
        errors: {},
        errorSummary: [],
        formValues: {},
      })
    })

    it('renders the submission page to edit an existing referral', async () => {
      request.params.id = id
      await controller.submission('edit')(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.EXTERNAL_REFERRALS_SUBMISSION, {
        who: 'user1',
        correlationId: 'request-id',
      })
      expect(casesService.getCase).toHaveBeenCalledWith(token, crn)
      expect(response.render).toHaveBeenCalledWith(
        'pages/external-referrals/submission',
        expect.objectContaining({
          pageTitle: 'Edit external referral details',
          backLinkHref: detailsPagePath,
        }),
      )
    })

    it('renders the submission page with errors and user input', async () => {
      const userInput = {
        referenceNumber: 'REF123',
        'submissionDate-year': '2026',
        'submissionDate-month': '02',
        'submissionDate-day': '30',
      }
      jest.spyOn(validationUtils, 'fetchErrorsAndUserInput').mockReturnValue({
        errors: { organisationName: { text: 'Enter organisation name' } },
        errorSummary: [{ text: 'Enter organisation name', href: '#organisationName' }],
        userInput,
      })

      await controller.submission('add')(request, response, next)

      expect(response.render).toHaveBeenCalledWith(
        'pages/external-referrals/submission',
        expect.objectContaining({
          errors: { organisationName: { text: 'Enter organisation name' } },
          errorSummary: [{ text: 'Enter organisation name', href: '#organisationName' }],
          formValues: userInput,
        }),
      )
    })

    it('redirects to the details page if the referral is withdrawn', async () => {
      externalReferralsService.getExternalReferralBySubmissionId.mockResolvedValue(
        apiResponseFactory.externalReferral(externalReferralFactory.withdrawn().build()),
      )
      request.params.id = id

      await controller.submission('edit')(request, response, next)

      expect(response.render).not.toHaveBeenCalled()
      expect(response.redirect).toHaveBeenCalledWith(detailsPagePath)
    })
  })

  describe('saveSubmission', () => {
    const referralData = {
      organisationName: 'Some organisation',
      referenceNumber: 'REF123',
      website: 'website.co.uk',
      submissionNote: 'This is a note',
      email: 'email@justice.gov.uk',
      phoneNumber: '12345678',
    }
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2025-07-01'))
      request = mock<Request>({
        params: { crn, id: undefined },
        body: {
          'submissionDate-year': '2025',
          'submissionDate-month': '06',
          'submissionDate-day': '15',
          ...referralData,
        },
        flash: jest.fn(),
      })
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('submits and redirects to the case details page', async () => {
      const referral = externalReferralFactory.submitted().build({ crn })
      externalReferralsService.submit.mockResolvedValue(referral)
      await controller.saveSubmission('add')(request, response, next)

      expect(externalReferralsService.submit).toHaveBeenCalledWith(token, crn, {
        status: 'SUBMITTED',
        submissionDate: '2025-06-15',
        ...referralData,
      })
      expect(casesService.getCase).not.toHaveBeenCalled()
      expect(request.flash).toHaveBeenCalledWith('success', 'Referral details added')
      expect(response.redirect).toHaveBeenCalledWith(casePagePath)
    })

    it('updates and redirects to the details page when editing', async () => {
      const referral = externalReferralFactory.submitted().build({ crn, submission: { id } })
      externalReferralsService.getExternalReferralBySubmissionId.mockResolvedValue(
        apiResponseFactory.externalReferral(referral),
      )

      request.params.id = id

      await controller.saveSubmission('edit')(request, response, next)

      expect(externalReferralsService.update).toHaveBeenCalledWith(token, crn, referral.submission.id, {
        status: 'SUBMITTED',
        submissionDate: '2025-06-15',
        ...referralData,
      })
      expect(casesService.getCase).not.toHaveBeenCalled()
      expect(request.flash).toHaveBeenCalledWith('success', 'Referral details changed')
      expect(response.redirect).toHaveBeenCalledWith(detailsPagePath)
    })

    it('redirects to submission page when validation fails', async () => {
      jest.spyOn(utils, 'validateSubmission').mockReturnValue(false)

      await controller.saveSubmission('add')(request, response, next)

      expect(externalReferralsService.submit).not.toHaveBeenCalled()
      expect(response.redirect).toHaveBeenCalledWith(submissionPagePath)
    })

    it('redirects to submission page when the API call fails', async () => {
      const errorFunc = () => {
        throw new Error('API error')
      }
      externalReferralsService.submit.mockImplementation(errorFunc)
      externalReferralsService.update.mockImplementation(errorFunc)

      await controller.saveSubmission('add')(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(submissionPagePath)
      expect(validationUtils.addGenericErrorToFlash).toHaveBeenCalledWith(
        request,
        'There was a problem saving the submission details. Please try again.',
      )
    })

    it('redirects to the details page if the referral is withdrawn', async () => {
      externalReferralsService.getExternalReferralBySubmissionId.mockResolvedValue(
        apiResponseFactory.externalReferral(externalReferralFactory.withdrawn().build()),
      )
      request.params.id = id

      await controller.saveSubmission('edit')(request, response, next)

      expect(externalReferralsService.update).not.toHaveBeenCalled()
      expect(response.redirect).toHaveBeenCalledWith(detailsPagePath)
    })
  })

  describe('addNote', () => {
    const note = 'note text'

    it('adds note then redirects to the referral details page', async () => {
      request.params.id = id
      request.body = { note }

      await controller.saveNote()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(detailsPagePath)
      expect(request.flash).toHaveBeenCalledWith('success', 'Note added')
      expect(externalReferralsService.saveNote).toHaveBeenCalledWith(token, crn, id, note)
    })

    it('redirects with error if there is no note', async () => {
      request.params.id = id
      request.body = { note: '' }

      await controller.saveNote()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(detailsPagePath)
      expect(validationUtils.validateAndFlashErrors).toHaveBeenCalledWith(request, {
        note: 'Enter a note',
      })
    })

    it('redirects if the API errors', async () => {
      externalReferralsService.saveNote.mockRejectedValue(new Error())
      request.params.id = id
      request.body = { note }

      await controller.saveNote()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(detailsPagePath)
      expect(validationUtils.addGenericErrorToFlash).toHaveBeenCalledWith(
        request,
        'There was a problem saving the note. Please try again.',
      )
    })
  })

  describe('outcome', () => {
    beforeEach(() => {
      request.params.id = id
    })

    it('renders the page for a submitted referral', async () => {
      await controller.outcome()(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.EXTERNAL_REFERRALS_OUTCOME, {
        who: 'user1',
        correlationId: 'request-id',
      })
      expect(casesService.getCase).toHaveBeenCalledWith(token, crn)
      expect(externalReferralsService.getExternalReferralBySubmissionId).toHaveBeenCalledWith(token, crn, id)

      expect(response.render).toHaveBeenCalledWith('pages/external-referrals/outcome', {
        backLinkHref: detailsPagePath,
        crn,
        errorSummary: [],
        errors: {},
        statusItems: [
          {
            checked: false,
            text: 'Accepted',
            value: 'ACCEPTED',
            conditional: {
              html: "<p class='govuk-body'>Once you have address details, add them as a 'Proposed address'.</p>",
            },
          },
          { checked: false, text: 'Rejected', value: 'REJECTED' },
        ],
        pageTitle: 'Add external referral outcome',
        tableRows: summaryListRows(caseData, submittedReferral),
      })
    })

    it('renders the page for a referral with an existing outcome', async () => {
      const referral = externalReferralFactory.accepted().build({ crn })
      externalReferralsService.getExternalReferralBySubmissionId.mockResolvedValue(
        apiResponseFactory.externalReferral(referral),
      )

      await controller.outcome()(request, response, next)

      expect(response.render).toHaveBeenCalledWith(
        'pages/external-referrals/outcome',
        expect.objectContaining({
          backLinkHref: detailsPagePath,
          crn,
          pageTitle: 'Edit external referral outcome',
          tableRows: summaryListRows(caseData, referral),
          outcomeNote: referral.submission.outcomeNote,
        }),
      )
    })

    it('redirects to the details page if the referral is withdrawn', async () => {
      externalReferralsService.getExternalReferralBySubmissionId.mockResolvedValue(
        apiResponseFactory.externalReferral(externalReferralFactory.withdrawn().build()),
      )
      request.params.id = id

      await controller.outcome()(request, response, next)

      expect(response.render).not.toHaveBeenCalled()
      expect(response.redirect).toHaveBeenCalledWith(detailsPagePath)
    })
  })

  describe('saveOutcome', () => {
    beforeEach(() => {
      request = mock<Request>({
        params: { crn, id },
        body: {
          outcomeStatus: 'ACCEPTED',
          outcomeNote: 'Outcome notes',
        },
        flash: jest.fn(),
      })
    })

    it('saves a new outcome and redirects to referral details', async () => {
      await controller.saveOutcome()(request, response, next)

      expect(externalReferralsService.update).toHaveBeenCalledWith(
        token,
        crn,
        id,
        expect.objectContaining({ status: 'ACCEPTED', outcomeNote: 'Outcome notes' }),
      )
      expect(request.flash).toHaveBeenCalledWith('success', {
        body: `If the organisation has shared a possible address, <a href="${uiPaths.proposedAddresses.start({ crn })}">add it as a proposed address</a>.`,
        heading: 'Outcome details added',
      })
      expect(response.redirect).toHaveBeenCalledWith(detailsPagePath)
    })

    it('accepts an existing rejected referral and redirects to referral details', async () => {
      externalReferralsService.getExternalReferralBySubmissionId.mockResolvedValue(
        apiResponseFactory.externalReferral(externalReferralFactory.rejected().build()),
      )
      request.body.outcomeStatus = 'ACCEPTED'

      await controller.saveOutcome()(request, response, next)

      expect(request.flash).toHaveBeenCalledWith('success', {
        body: `If the organisation has shared a possible address, <a href="${uiPaths.proposedAddresses.start({ crn })}">add it as a proposed address</a>.`,
        heading: 'Outcome details changed',
      })
    })

    it('rejects an existing accepted outcome', async () => {
      externalReferralsService.getExternalReferralBySubmissionId.mockResolvedValue(
        apiResponseFactory.externalReferral(externalReferralFactory.accepted().build()),
      )
      request.body.outcomeStatus = 'REJECTED'

      await controller.saveOutcome()(request, response, next)

      expect(request.flash).toHaveBeenCalledWith('success', {
        body: undefined,
        heading: 'Outcome details changed',
      })
    })

    it('redirects to outcome page if validation fails', async () => {
      jest.spyOn(utils, 'validateOutcome').mockReturnValue(false)

      await controller.saveOutcome()(request, response, next)

      expect(externalReferralsService.update).not.toHaveBeenCalled()
      expect(response.redirect).toHaveBeenCalledWith(outcomePagePath)
    })

    it('redirects to external referrals details page when the API call fails', async () => {
      externalReferralsService.update.mockRejectedValue(new Error('API error'))

      await controller.saveOutcome()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(outcomePagePath)
    })

    it('redirects to the details page if the referral is withdrawn', async () => {
      externalReferralsService.getExternalReferralBySubmissionId.mockResolvedValue(
        apiResponseFactory.externalReferral(externalReferralFactory.withdrawn().build()),
      )

      await controller.saveOutcome()(request, response, next)

      expect(externalReferralsService.update).not.toHaveBeenCalled()
      expect(response.redirect).toHaveBeenCalledWith(detailsPagePath)
    })
  })

  describe('withdrawal', () => {
    beforeEach(() => {
      request.params.id = id
    })

    it('renders the withdrawal page', async () => {
      await controller.withdrawal()(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.EXTERNAL_REFERRALS_WITHDRAWAL, {
        who: 'user1',
        correlationId: 'request-id',
      })
      expect(casesService.getCase).toHaveBeenCalledWith(token, crn)
      expect(externalReferralsService.getExternalReferralBySubmissionId).toHaveBeenCalledWith(token, crn, id)

      expect(response.render).toHaveBeenCalledWith('pages/external-referrals/withdrawal', {
        backLinkHref: detailsPagePath,
        errorSummary: [],
        errors: {},
        pageTitle: 'Move to referral history',
        tableRows: summaryListRows(caseData, submittedReferral, true),
        withdrawalReasons: withdrawalReasonRadios(undefined, {}),
        submitButtonText: 'Move to referral history',
      })
    })

    it('redirects to the details page if the referral is withdrawn', async () => {
      externalReferralsService.getExternalReferralBySubmissionId.mockResolvedValue(
        apiResponseFactory.externalReferral(externalReferralFactory.withdrawn().build()),
      )

      await controller.withdrawal()(request, response, next)

      expect(response.render).not.toHaveBeenCalled()
      expect(response.redirect).toHaveBeenCalledWith(detailsPagePath)
    })
  })

  describe('saveWithdrawal', () => {
    beforeEach(() => {
      jest.resetAllMocks()
      jest.restoreAllMocks()

      request = mock<Request>({
        params: { crn, id },
        body: {
          withdrawalReason: 'NO_CAPACITY',
        },
        flash: jest.fn(),
      })
    })

    it('saves withdrawal reason and redirects to case page', async () => {
      const referral = externalReferralFactory.submitted().build()
      externalReferralsService.getExternalReferralBySubmissionId.mockResolvedValue(
        apiResponseFactory.externalReferral(referral),
      )

      await controller.saveWithdrawal()(request, response, next)

      expect(externalReferralsService.withdrawal).toHaveBeenCalledWith(
        token,
        crn,
        id,
        expect.objectContaining({ withdrawalReason: 'NO_CAPACITY' }),
      )
      expect(request.flash).toHaveBeenCalledWith('success', 'Moved to referral history')
      expect(response.redirect).toHaveBeenCalledWith(casePagePath)
    })

    it('redirects to withdrawal page if validation fails', async () => {
      jest.spyOn(utils, 'validateWithdrawal').mockReturnValue(false)

      await controller.saveWithdrawal()(request, response, next)

      expect(externalReferralsService.update).not.toHaveBeenCalled()
      expect(response.redirect).toHaveBeenCalledWith(withdrawalPagePath)
    })

    it('redirects to withdrawal page if the API call fails', async () => {
      externalReferralsService.withdrawal.mockRejectedValue(new Error('API error'))

      await controller.saveWithdrawal()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(withdrawalPagePath)
    })

    it('redirects to the details page if the referral is withdrawn', async () => {
      externalReferralsService.getExternalReferralBySubmissionId.mockResolvedValue(
        apiResponseFactory.externalReferral(externalReferralFactory.withdrawn().build()),
      )

      await controller.saveWithdrawal()(request, response, next)

      expect(externalReferralsService.update).not.toHaveBeenCalled()
      expect(response.redirect).toHaveBeenCalledWith(casePagePath)
    })
  })
})
