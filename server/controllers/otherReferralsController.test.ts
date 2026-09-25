import { NextFunction, Request, Response } from 'express'
import { mock } from 'jest-mock-extended'
import AuditService, { Page } from '../services/auditService'
import * as validationUtils from '../utils/validation'
import CasesService from '../services/casesService'
import OtherReferralsController from './otherReferralsController'
import { apiResponseFactory, caseFactory, otherAccommodationReferralFactory } from '../testutils/factories'
import OtherReferralsService from '../services/otherReferralsService'
import uiPaths from '../paths/ui'

import * as utils from '../utils/otherReferrals'
import { breadcrumbs } from '../utils/breadcrumbs'
import { caseAssignedTo, displayName } from '../utils/cases'
import { summaryListRows } from '../utils/dutyToRefer'
import { detailsSummaryListRows } from '../utils/otherReferrals'

describe('OtherReferralsController', () => {
  let request: Request
  const response = mock<Response>({ locals: { user: { username: 'user1', token: 'token-1' } } })
  const next = mock<NextFunction>()

  const auditService = mock<AuditService>()
  const casesService = mock<CasesService>()
  const otherReferralsService = mock<OtherReferralsService>()

  const id = '123'
  const crn = 'CRN123'

  const caseData = caseFactory.build({
    forename: 'James',
    surname: 'Smith',
    crn,
  })

  let controller: OtherReferralsController
  beforeEach(() => {
    jest.clearAllMocks()

    casesService.getCase.mockResolvedValue(apiResponseFactory.case(caseData))

    request = mock<Request>({
      id: 'request-id',
      params: { crn, id: undefined },
      body: {},
      flash: jest.fn(),
    })

    controller = new OtherReferralsController(auditService, otherReferralsService, casesService)
    jest
      .spyOn(validationUtils, 'fetchErrorsAndUserInput')
      .mockReturnValue({ errors: {}, errorSummary: [], userInput: {} })

    jest.spyOn(validationUtils, 'validateAndFlashErrors')
    jest.spyOn(validationUtils, 'addGenericErrorToFlash')
    jest.spyOn(validationUtils, 'addUserInputToFlash')
  })

  describe('show', () => {
    const referral = otherAccommodationReferralFactory.submitted().build({ crn })

    beforeEach(() => {
      request.params.id = id
      otherReferralsService.getOtherReferralBySubmissionId.mockResolvedValue(apiResponseFactory.otherReferral(referral))
    })

    it('renders the referral details page', async () => {
      await controller.show()(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.EXTERNAL_REFFERALS_DETAILS, {
        who: 'user1',
        correlationId: 'request-id',
      })

      expect(response.render).toHaveBeenCalledWith('pages/other-referrals/show', {
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
        'pages/other-referrals/show',
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
      expect(response.render).toHaveBeenCalledWith('pages/other-referrals/submission', {
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
        'pages/other-referrals/submission',
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
      const referral = otherAccommodationReferralFactory.submitted().build({ crn })
      otherReferralsService.submit.mockResolvedValue(referral)
      await controller.saveSubmission('add')(request, response, next)

      expect(otherReferralsService.submit).toHaveBeenCalledWith('token-1', crn, {
        status: 'SUBMITTED',
        submissionDate: '2025-06-15',
        ...referralData,
      })
      expect(casesService.getCase).not.toHaveBeenCalled()
      expect(request.flash).toHaveBeenCalledWith('success', 'Referral details added')
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.cases.show({ crn }))
    })

    it('updates and redirects to the details page when editing', async () => {
      const referral = otherAccommodationReferralFactory.submitted().build({ crn, submission: { id } })
      otherReferralsService.getOtherReferralBySubmissionId.mockResolvedValue(apiResponseFactory.otherReferral(referral))

      request.params.id = id

      await controller.saveSubmission('edit')(request, response, next)

      expect(otherReferralsService.update).toHaveBeenCalledWith('token-1', 'CRN123', referral.submission.id, {
        status: 'SUBMITTED',
        submissionDate: '2025-06-15',
        ...referralData,
      })
      expect(casesService.getCase).not.toHaveBeenCalled()
      expect(request.flash).toHaveBeenCalledWith('success', 'Referral details changed')
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.otherReferrals.show({ crn, id }))
    })

    it('redirects to submission page when validation fails', async () => {
      jest.spyOn(utils, 'validateSubmission').mockReturnValue(false)

      await controller.saveSubmission('add')(request, response, next)

      expect(otherReferralsService.submit).not.toHaveBeenCalled()
      expect(response.redirect).toHaveBeenCalledWith('/cases/CRN123/other-referrals/submission')
    })

    it('redirects to submission page when the API call fails', async () => {
      otherReferralsService.submit.mockRejectedValue(new Error('API error'))
      otherReferralsService.update.mockRejectedValue(new Error('API error'))

      await controller.saveSubmission('add')(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith('/cases/CRN123/other-referrals/submission')
    })
  })
})
