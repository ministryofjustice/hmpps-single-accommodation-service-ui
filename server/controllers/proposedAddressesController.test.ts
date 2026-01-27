import { NextFunction, Request, Response } from 'express'
import { mock } from 'jest-mock-extended'
import { ProposedAddressFormData } from '@sas/ui'
import ProposedAddressesController from './proposedAddressesController'
import AuditService, { Page } from '../services/auditService'
import ProposedAddressesService from '../services/proposedAddressesService'
import uiPaths from '../paths/ui'
import { user } from '../routes/testutils/appSetup'
import {
  summaryListRows,
  updateAddressFromBody,
  updateTypeFromBody,
  updateStatusFromBody,
  validateAddressFromSession,
  validateTypeFromSession,
  validateStatusFromSession,
} from '../utils/proposedAddresses'
import { fetchErrors } from '../utils/validation'
import CasesService from '../services/casesService'
import { getCaseData } from '../utils/cases'

jest.mock('../utils/proposedAddresses', () => ({
  summaryListRows: jest.fn(),
  updateAddressFromBody: jest.fn(),
  updateTypeFromBody: jest.fn(),
  updateStatusFromBody: jest.fn(),
  validateAddressFromSession: jest.fn(),
  validateTypeFromSession: jest.fn(),
  validateStatusFromSession: jest.fn(),
}))

jest.mock('../utils/validation', () => ({
  fetchErrors: jest.fn(),
}))

jest.mock('../utils/cases', () => ({
  getCaseData: jest.fn(),
}))

describe('proposedAddressesController', () => {
  const request = mock<Request>({
    id: 'request-id',
    params: { crn: 'CRN123' },
    session: {
      save: jest.fn().mockImplementation((callback: () => unknown) => callback()),
    },
  })
  const response = mock<Response>({ locals: { user: { username: 'user1', token: 'token-1' } } })
  const next = mock<NextFunction>()

  const auditService = mock<AuditService>()
  const proposedAddressesService = mock<ProposedAddressesService>()
  const casesService = mock<CasesService>()
  const sessionData: ProposedAddressFormData = {
    address: {
      line1: 'Line 1',
      line2: 'Line 2',
      city: 'Town',
      region: 'Region',
      postcode: 'AB1 2CD',
      country: 'UK',
    },
    housingArrangementType: 'FRIEND_OR_FAMILY',
    housingArrangementTypeDescription: '',
    settledType: 'SETTLED',
    status: 'PASSED',
  }

  let controller: ProposedAddressesController

  beforeEach(() => {
    controller = new ProposedAddressesController(auditService, proposedAddressesService, casesService)
    ;(fetchErrors as jest.Mock).mockReturnValue({ errors: {}, errorSummary: [] })
    ;(getCaseData as jest.Mock).mockReturnValue({ name: 'James Smith' })

    jest.spyOn(controller.formData, 'update')
    jest.spyOn(controller.formData, 'remove')
    jest.spyOn(controller.formData, 'get').mockReturnValue(undefined)
  })

  describe('start', () => {
    it('redirects to details', async () => {
      await controller.start()(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.ADD_PROPOSED_ADDRESS, {
        who: user.username,
        correlationId: 'request-id',
      })
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.details({ crn: 'CRN123' }))
    })
  })

  describe('details', () => {
    it('renders details page', async () => {
      await controller.details()(request, response, next)

      expect(response.render).toHaveBeenCalledWith('pages/proposed-address/details', {
        crn: 'CRN123',
        address: {},
        errors: {},
        errorSummary: [],
      })
    })

    it('renders details page with session data', async () => {
      jest.spyOn(controller.formData, 'get').mockReturnValue(sessionData)

      await controller.details()(request, response, next)

      expect(response.render).toHaveBeenCalledWith('pages/proposed-address/details', {
        crn: 'CRN123',
        address: {
          line1: 'Line 1',
          line2: 'Line 2',
          city: 'Town',
          region: 'Region',
          postcode: 'AB1 2CD',
          country: 'UK',
        },
        errors: {},
        errorSummary: [],
      })
    })
  })

  describe('type', () => {
    it('renders arrangement type page', async () => {
      ;(validateAddressFromSession as jest.Mock).mockReturnValue(true)

      await controller.type()(request, response, next)

      expect(response.render).toHaveBeenCalledWith('pages/proposed-address/type', {
        crn: 'CRN123',
        proposedAddress: undefined,
        name: 'James Smith',
        errors: {},
        errorSummary: [],
      })
    })

    it('renders arrangement type page with session data', async () => {
      jest.spyOn(controller.formData, 'get').mockReturnValue(sessionData)
      ;(validateAddressFromSession as jest.Mock).mockReturnValue(true)

      await controller.type()(request, response, next)

      expect(response.render).toHaveBeenCalledWith('pages/proposed-address/type', {
        crn: 'CRN123',
        proposedAddress: sessionData,
        name: 'James Smith',
        errors: {},
        errorSummary: [],
      })
    })

    it('redirects to details page when address validation fails', async () => {
      ;(validateAddressFromSession as jest.Mock).mockReturnValue(false)

      await controller.type()(request, response, next)

      expect(updateAddressFromBody).toHaveBeenCalledWith(request, controller.formData)
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.details({ crn: 'CRN123' }))
    })
  })

  describe('status', () => {
    it('renders status page', async () => {
      ;(validateTypeFromSession as jest.Mock).mockReturnValue(true)

      await controller.status()(request, response, next)

      expect(response.render).toHaveBeenCalledWith('pages/proposed-address/status', {
        crn: 'CRN123',
        proposedAddress: undefined,
        errors: {},
        errorSummary: [],
      })
    })

    it('renders status page with session data', async () => {
      jest.spyOn(controller.formData, 'get').mockReturnValue(sessionData)
      ;(validateTypeFromSession as jest.Mock).mockReturnValue(true)

      await controller.status()(request, response, next)

      expect(response.render).toHaveBeenCalledWith('pages/proposed-address/status', {
        crn: 'CRN123',
        proposedAddress: sessionData,
        errors: {},
        errorSummary: [],
      })
    })

    it('redirects to type page when type validation fails', async () => {
      ;(validateTypeFromSession as jest.Mock).mockReturnValue(false)

      await controller.status()(request, response, next)

      expect(updateTypeFromBody).toHaveBeenCalledWith(request, controller.formData)
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.type({ crn: 'CRN123' }))
    })
  })

  describe('checkYourAnswers', () => {
    it('renders check your answers', async () => {
      ;(validateStatusFromSession as jest.Mock).mockReturnValue(true)
      ;(summaryListRows as jest.Mock).mockReturnValue([
        { key: { text: 'Address' }, value: { html: 'Line 1<br />Line 2' } },
      ])

      await controller.checkYourAnswers()(request, response, next)

      expect(updateStatusFromBody).toHaveBeenCalledWith(request, controller.formData)
      expect(response.render).toHaveBeenCalledWith('pages/proposed-address/check-your-answers', {
        crn: 'CRN123',
        tableRows: [{ key: { text: 'Address' }, value: { html: 'Line 1<br />Line 2' } }],
      })
    })

    it('redirects to status page when status validation fails', async () => {
      ;(validateStatusFromSession as jest.Mock).mockReturnValue(false)

      await controller.checkYourAnswers()(request, response, next)

      expect(updateStatusFromBody).toHaveBeenCalledWith(request, controller.formData)
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.status({ crn: 'CRN123' }))
    })
  })

  describe('submit', () => {
    it('submits, clears session data and redirects', async () => {
      jest.spyOn(controller.formData, 'get').mockReturnValue(sessionData)

      await controller.submit()(request, response, next)

      expect(proposedAddressesService.submit).toHaveBeenCalledWith('token-1', 'CRN123', sessionData)
      expect(controller.formData.remove).toHaveBeenCalledWith('CRN123', request.session)
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.cases.show({ crn: 'CRN123' }))
    })
  })

  describe('cancel', () => {
    it('clears session data and redirects', async () => {
      await controller.cancel()(request, response, next)

      expect(controller.formData.remove).toHaveBeenCalledWith('CRN123', request.session)
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.cases.show({ crn: 'CRN123' }))
    })
  })
})
