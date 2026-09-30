import { NextFunction, Request, Response } from 'express'
import { mock } from 'jest-mock-extended'
import AuditService, { Page } from '../services/auditService'
import { summaryListRows } from '../utils/dutyToRefer'
import * as validationUtils from '../utils/validation'
import CasesService from '../services/casesService'
import OtherReferralsController from './otherReferralsController'
import { apiResponseFactory, caseFactory } from '../testutils/factories'
import OtherReferralsService from '../services/otherReferralsService'

describe('OtherReferralsController', () => {
  let request: Request
  const response = mock<Response>({ locals: { user: { username: 'user1', token: 'token-1' } } })
  const next = mock<NextFunction>()

  const auditService = mock<AuditService>()
  const casesService = mock<CasesService>()
  const otherReferralsService = mock<OtherReferralsService>()

  const caseData = caseFactory.build({
    forename: 'James',
    surname: 'Smith',
    crn: 'CRN123',
  })

  let controller: OtherReferralsController
  beforeEach(() => {
    jest.clearAllMocks()

    casesService.getCase.mockResolvedValue(apiResponseFactory.case(caseData))

    request = mock<Request>({
      id: 'request-id',
      params: { crn: 'CRN123', id: undefined },
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

  describe('submission', () => {
    it('renders the submission page for a first referral', async () => {
      await controller.submission('add')(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.EXTERNAL_REFFERALS_SUBMISSION, {
        who: 'user1',
        correlationId: 'request-id',
      })
      expect(casesService.getCase).toHaveBeenCalledWith('token-1', 'CRN123')
      expect(response.render).toHaveBeenCalledWith('pages/other-referrals/submission', {
        pageTitle: 'Add other accommodation referral details',
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
})
