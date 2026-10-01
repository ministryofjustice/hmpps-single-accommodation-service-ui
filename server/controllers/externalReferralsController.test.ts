import { NextFunction, Request, Response } from 'express'
import { mock } from 'jest-mock-extended'
import AuditService, { Page } from '../services/auditService'
import * as validationUtils from '../utils/validation'
import CasesService from '../services/casesService'
import ExternalReferralsController from './externalReferralsController'
import { apiResponseFactory, caseFactory, externalReferralFactory } from '../testutils/factories'
import ExternalReferralsService from '../services/externalReferralsService'
import uiPaths from '../paths/ui'

import * as utils from '../utils/externalReferrals'
import { breadcrumbs } from '../utils/breadcrumbs'
import { caseAssignedTo, displayName } from '../utils/cases'
import { summaryListRows } from '../utils/dutyToRefer'
import { detailsSummaryListRows } from '../utils/externalReferrals'

describe('ExternalReferralsController', () => {
  let request: Request
  const response = mock<Response>({ locals: { user: { username: 'user1', token: 'token-1' } } })
  const next = mock<NextFunction>()

  const auditService = mock<AuditService>()
  const casesService = mock<CasesService>()
  const externalReferralsService = mock<ExternalReferralsService>()

  const id = '123'
  const crn = 'CRN123'

  const caseData = caseFactory.build({
    forename: 'James',
    surname: 'Smith',
    crn,
  })

  let controller: ExternalReferralsController
  beforeEach(() => {
    jest.clearAllMocks()

    casesService.getCase.mockResolvedValue(apiResponseFactory.case(caseData))

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
  })

  describe('show', () => {
    const referral = externalReferralFactory.submitted().build({ crn })

    beforeEach(() => {
      request.params.id = id
      externalReferralsService.getExternalReferralBySubmissionId.mockResolvedValue(
        apiResponseFactory.externalReferral(referral),
      )
    })

    it('renders the referral details page', async () => {
      await controller.show()(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.EXTERNAL_REFFERALS_DETAILS, {
        who: 'user1',
        correlationId: 'request-id',
      })

      expect(response.render).toHaveBeenCalledWith('pages/external-referrals/show', {
        breadcrumbs: breadcrumbs(request, caseData),
        crn,
        referralId: id,
        displayName: displayName(caseData),
        caseData,
        assignedTo: caseAssignedTo(caseData, 'user1'),
        referral,
        submissionDetailRows: detailsSummaryListRows(referral),
        status: referral.status,
        errors: {},
        errorSummary: [],
      })
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

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.EXTERNAL_REFFERALS_SUBMISSION, {
        who: 'user1',
        correlationId: 'request-id',
      })
      expect(casesService.getCase).toHaveBeenCalledWith('token-1', 'CRN123')
      expect(response.render).toHaveBeenCalledWith('pages/external-referrals/submission', {
        pageTitle: 'Add external referral details',
        backLinkHref: '/cases/CRN123',
        crn: 'CRN123',
        tableRows: summaryListRows(caseData),
        errors: {},
        errorSummary: [],
        formValues: {},
      })
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
        params: { crn: 'CRN123', id: undefined },
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

      expect(externalReferralsService.submit).toHaveBeenCalledWith('token-1', crn, {
        status: 'SUBMITTED',
        submissionDate: '2025-06-15',
        ...referralData,
      })
      expect(casesService.getCase).not.toHaveBeenCalled()
      expect(request.flash).toHaveBeenCalledWith('success', 'Referral details added')
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.cases.show({ crn }))
    })

    it('updates and redirects to the details page when editing', async () => {
      const referral = externalReferralFactory.submitted().build({ crn, submission: { id } })
      externalReferralsService.getExternalReferralBySubmissionId.mockResolvedValue(
        apiResponseFactory.externalReferral(referral),
      )

      request.params.id = id

      await controller.saveSubmission('edit')(request, response, next)

      expect(externalReferralsService.update).toHaveBeenCalledWith('token-1', 'CRN123', referral.submission.id, {
        status: 'SUBMITTED',
        submissionDate: '2025-06-15',
        ...referralData,
      })
      expect(casesService.getCase).not.toHaveBeenCalled()
      expect(request.flash).toHaveBeenCalledWith('success', 'Referral details changed')
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.externalReferrals.show({ crn, id }))
    })

    it('redirects to submission page when validation fails', async () => {
      jest.spyOn(utils, 'validateSubmission').mockReturnValue(false)

      await controller.saveSubmission('add')(request, response, next)

      expect(externalReferralsService.submit).not.toHaveBeenCalled()
      expect(response.redirect).toHaveBeenCalledWith('/cases/CRN123/external-referrals/submission')
    })

    it('redirects to submission page when the API call fails', async () => {
      externalReferralsService.submit.mockRejectedValue(new Error('API error'))
      externalReferralsService.update.mockRejectedValue(new Error('API error'))

      await controller.saveSubmission('add')(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith('/cases/CRN123/external-referrals/submission')
    })
  })
})
