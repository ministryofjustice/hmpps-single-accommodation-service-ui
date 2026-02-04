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
  updateAddressFromRequest,
  updateTypeFromRequest,
  updateStatusFromRequest,
  updateConfirmationFromRequest,
  validateAddressFromSession,
  validateTypeFromSession,
  validateStatusFromSession,
  validateConfirmationFromSession,
} from '../utils/proposedAddresses'
import { fetchErrors } from '../utils/validation'
import CasesService from '../services/casesService'
import { getCaseData } from '../utils/cases'

jest.mock('../utils/proposedAddresses', () => ({
  summaryListRows: jest.fn(),
  updateAddressFromRequest: jest.fn(),
  updateTypeFromRequest: jest.fn(),
  updateStatusFromRequest: jest.fn(),
  updateConfirmationFromRequest: jest.fn(),
  validateAddressFromSession: jest.fn(),
  validateTypeFromSession: jest.fn(),
  validateStatusFromSession: jest.fn(),
  validateConfirmationFromSession: jest.fn(),
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
      buildingName: 'Line 1',
      subBuildingName: 'Line 2',
      postTown: 'Town',
      county: 'Region',
      postcode: 'AB1 2CD',
      country: 'UK',
    },
    arrangementSubType: 'FRIENDS_OR_FAMILY',
    arrangementSubTypeDescription: '',
    settledType: 'SETTLED',
    status: 'CHECKS_PASSED',
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
          buildingName: 'Line 1',
          subBuildingName: 'Line 2',
          postTown: 'Town',
          county: 'Region',
          postcode: 'AB1 2CD',
          country: 'UK',
        },
        errors: {},
        errorSummary: [],
      })
    })
  })

  describe('saveDetails', () => {
    it('redirects to type when address valid', async () => {
      ;(validateAddressFromSession as jest.Mock).mockReturnValue(true)

      await controller.saveDetails()(request, response, next)

      expect(updateAddressFromRequest).toHaveBeenCalledWith(request, controller.formData)
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.type({ crn: 'CRN123' }))
    })

    it('redirects to details when address invalid', async () => {
      ;(validateAddressFromSession as jest.Mock).mockReturnValue(false)

      await controller.saveDetails()(request, response, next)

      expect(updateAddressFromRequest).toHaveBeenCalledWith(request, controller.formData)
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.details({ crn: 'CRN123' }))
    })
  })

  describe('type', () => {
    it('renders arrangement type page', async () => {
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

      await controller.type()(request, response, next)

      expect(response.render).toHaveBeenCalledWith('pages/proposed-address/type', {
        crn: 'CRN123',
        proposedAddress: sessionData,
        name: 'James Smith',
        errors: {},
        errorSummary: [],
      })
    })
  })

  describe('saveType', () => {
    it('redirects to status when arrangement type valid', async () => {
      ;(validateTypeFromSession as jest.Mock).mockReturnValue(true)

      await controller.saveType()(request, response, next)

      expect(updateTypeFromRequest).toHaveBeenCalledWith(request, controller.formData)
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.status({ crn: 'CRN123' }))
    })

    it('redirects to arrangement type when arrangement type invalid', async () => {
      ;(validateTypeFromSession as jest.Mock).mockReturnValue(false)

      await controller.saveType()(request, response, next)

      expect(updateTypeFromRequest).toHaveBeenCalledWith(request, controller.formData)
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.type({ crn: 'CRN123' }))
    })
  })

  describe('status', () => {
    it('renders status page', async () => {
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

      await controller.status()(request, response, next)

      expect(response.render).toHaveBeenCalledWith('pages/proposed-address/status', {
        crn: 'CRN123',
        proposedAddress: sessionData,
        errors: {},
        errorSummary: [],
      })
    })
  })

  describe('saveStatus', () => {
    it('redirects to check your answers when status valid', async () => {
      ;(validateStatusFromSession as jest.Mock).mockReturnValue(true)

      await controller.saveStatus()(request, response, next)

      expect(updateStatusFromRequest).toHaveBeenCalledWith(request, controller.formData)
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.checkYourAnswers({ crn: 'CRN123' }))
    })

    it('redirects to confirmation when status is CHECKS_PASSED', async () => {
      jest.spyOn(controller.formData, 'get').mockReturnValue({
        ...sessionData,
        status: 'CHECKS_PASSED',
      })
      ;(validateStatusFromSession as jest.Mock).mockReturnValue(true)

      await controller.saveStatus()(request, response, next)

      expect(updateStatusFromRequest).toHaveBeenCalledWith(request, controller.formData)
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.confirmation({ crn: 'CRN123' }))
    })

    it('redirects to status when status invalid', async () => {
      ;(validateStatusFromSession as jest.Mock).mockReturnValue(false)

      await controller.saveStatus()(request, response, next)

      expect(updateStatusFromRequest).toHaveBeenCalledWith(request, controller.formData)
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.status({ crn: 'CRN123' }))
    })
  })

  describe('confirmation', () => {
    it('renders confirmation page', async () => {
      await controller.confirmation()(request, response, next)

      expect(response.render).toHaveBeenCalledWith('pages/proposed-address/confirmation', {
        crn: 'CRN123',
        proposedAddress: undefined,
        name: 'James Smith',
        errors: {},
        errorSummary: [],
      })
    })

    it('renders confirmation page with session data', async () => {
      jest.spyOn(controller.formData, 'get').mockReturnValue(sessionData)

      await controller.confirmation()(request, response, next)

      expect(response.render).toHaveBeenCalledWith('pages/proposed-address/confirmation', {
        crn: 'CRN123',
        proposedAddress: sessionData,
        name: 'James Smith',
        errors: {},
        errorSummary: [],
      })
    })
  })

  describe('saveConfirmation', () => {
    it('redirects to check your answers when confirmation valid', async () => {
      ;(validateConfirmationFromSession as jest.Mock).mockReturnValue(true)

      await controller.saveConfirmation()(request, response, next)
      expect(updateConfirmationFromRequest).toHaveBeenCalledWith(request, controller.formData)
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.checkYourAnswers({ crn: 'CRN123' }))
    })

    it('redirects to confirmation when confirmation invalid', async () => {
      ;(validateConfirmationFromSession as jest.Mock).mockReturnValue(false)

      await controller.saveConfirmation()(request, response, next)

      expect(updateConfirmationFromRequest).toHaveBeenCalledWith(request, controller.formData)
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.confirmation({ crn: 'CRN123' }))
    })
  })

  describe('checkYourAnswers', () => {
    it('renders check your answers', async () => {
      ;(summaryListRows as jest.Mock).mockReturnValue([
        { key: { text: 'Address' }, value: { html: 'Line 1<br />Line 2' } },
      ])

      await controller.checkYourAnswers()(request, response, next)

      expect(response.render).toHaveBeenCalledWith('pages/proposed-address/check-your-answers', {
        crn: 'CRN123',
        tableRows: [{ key: { text: 'Address' }, value: { html: 'Line 1<br />Line 2' } }],
        backLinkHref: uiPaths.proposedAddresses.status({ crn: 'CRN123' }),
      })
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
