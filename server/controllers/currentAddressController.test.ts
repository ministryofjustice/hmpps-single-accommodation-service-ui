import { NextFunction, Request, Response } from 'express'
import { mock } from 'jest-mock-extended'
import CurrentAddressController from './currentAddressController'
import AuditService, { Page } from '../services/auditService'
import CasesService from '../services/casesService'
import ProposedAddressesService from '../services/proposedAddressesService'
import uiPaths from '../paths/ui'
import * as backlinks from '../utils/backlinks'
import * as validationUtils from '../utils/validation'
import { apiResponseFactory, caseFactory, proposedAccommodationFactory } from '../testutils/factories'
import { displayName } from '../utils/cases'
import { deliusAddressHistoryUrl, NEW_ADDRESS_OPTION, proposedAddressItems } from '../utils/currentAddress'

describe('currentAddressController', () => {
  let request: Request
  const response = mock<Response>({ locals: { user: { username: 'user1', token: 'token-1' } } })
  const next = mock<NextFunction>()

  const auditService = mock<AuditService>()
  const casesService = mock<CasesService>()
  const proposedAddressesService = mock<ProposedAddressesService>()

  const caseData = caseFactory.build({ forename: 'James', surname: 'Walker', crn: 'CRN123' })
  const proposedAddress = proposedAccommodationFactory.build({ verificationStatus: 'PASSED' })

  let controller: CurrentAddressController

  const stubProposedAddresses = (proposed = [proposedAddress]) =>
    proposedAddressesService.getProposedAddresses.mockResolvedValue({
      upstreamFailures: [],
      data: { proposed, failedChecks: [] },
    })

  beforeEach(() => {
    jest.clearAllMocks()

    casesService.getCase.mockResolvedValue(apiResponseFactory.case(caseData))
    stubProposedAddresses()

    request = mock<Request>({
      id: 'request-id',
      params: { crn: 'CRN123' },
      body: {},
      flash: jest.fn(),
    })

    controller = new CurrentAddressController(auditService, casesService, proposedAddressesService)

    jest.spyOn(backlinks, 'getPageBackLink').mockReturnValue(uiPaths.cases.show({ crn: 'CRN123' }))
    jest
      .spyOn(validationUtils, 'fetchErrorsAndUserInput')
      .mockReturnValue({ errors: {}, errorSummary: [], userInput: {} })
    jest.spyOn(validationUtils, 'addGenericErrorToFlash')
  })

  describe('select', () => {
    it('renders the list of proposed addresses that have not failed checks', async () => {
      await controller.select()(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.CURRENT_ADDRESS_SELECT, {
        who: 'user1',
        correlationId: 'request-id',
      })
      expect(proposedAddressesService.getProposedAddresses).toHaveBeenCalledWith('token-1', 'CRN123', {
        excludeVerificationFailed: true,
      })
      expect(response.render).toHaveBeenCalledWith('pages/current-address/select', {
        crn: 'CRN123',
        backLinkHref: uiPaths.cases.show({ crn: 'CRN123' }),
        cancelLinkHref: uiPaths.cases.show({ crn: 'CRN123' }),
        pageHeading: `What is the new current address for ${displayName(caseData)}?`,
        items: proposedAddressItems([proposedAddress]),
        errors: {},
        errorSummary: [],
      })
    })

    it('redirects to the nDelius page when there are no proposed addresses', async () => {
      stubProposedAddresses([])

      await controller.select()(request, response, next)

      expect(response.render).not.toHaveBeenCalled()
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.currentAddress.new({ crn: 'CRN123' }))
    })
  })

  describe('saveSelect', () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2026-06-29T12:00:00.000Z'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('sets the selected proposed address as the current address', async () => {
      request.body = { proposedAddressId: proposedAddress.id }

      await controller.saveSelect()(request, response, next)

      expect(proposedAddressesService.submitArrival).toHaveBeenCalledWith('token-1', 'CRN123', proposedAddress.id, {
        arrivalDate: '2026-06-29',
      })
      expect(request.flash).toHaveBeenCalledWith('success', 'Current address changed')
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.cases.show({ crn: 'CRN123' }))
    })

    it('redirects to the nDelius page when the user chooses to add a new address', async () => {
      request.body = { proposedAddressId: NEW_ADDRESS_OPTION }

      await controller.saveSelect()(request, response, next)

      expect(proposedAddressesService.submitArrival).not.toHaveBeenCalled()
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.currentAddress.new({ crn: 'CRN123' }))
    })

    it('redirects back to the selection page when nothing is selected', async () => {
      request.body = {}

      await controller.saveSelect()(request, response, next)

      expect(proposedAddressesService.submitArrival).not.toHaveBeenCalled()
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.currentAddress.select({ crn: 'CRN123' }))
    })

    it('redirects back to the selection page when there is an API error', async () => {
      request.body = { proposedAddressId: proposedAddress.id }
      proposedAddressesService.submitArrival.mockRejectedValue(new Error('API error'))

      await controller.saveSelect()(request, response, next)

      expect(validationUtils.addGenericErrorToFlash).toHaveBeenCalledWith(
        request,
        'There was a problem saving the current address. Please try again.',
      )
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.currentAddress.select({ crn: 'CRN123' }))
    })
  })

  describe('addNew', () => {
    it('renders the nDelius page', async () => {
      await controller.addNew()(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.CURRENT_ADDRESS_NEW, {
        who: 'user1',
        correlationId: 'request-id',
      })
      expect(response.render).toHaveBeenCalledWith('pages/current-address/new', {
        backLinkHref: uiPaths.cases.show({ crn: 'CRN123' }),
        displayName: displayName(caseData),
        deliusLink: deliusAddressHistoryUrl('CRN123'),
      })
    })
  })
})
