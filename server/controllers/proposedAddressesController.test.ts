import { NextFunction, Request, Response } from 'express'
import { mock } from 'jest-mock-extended'
import { ProposedAddressFormData } from '@sas/ui'
import ProposedAddressesController from './proposedAddressesController'
import AuditService, { Page } from '../services/auditService'
import ProposedAddressesService from '../services/proposedAddressesService'
import uiPaths from '../paths/ui'
import { user } from '../routes/testutils/appSetup'
import * as proposedAddressesUtils from '../utils/proposedAddresses'
import * as validationUtils from '../utils/validation'
import CasesService from '../services/casesService'
import { accommodationFactory } from '../testutils/factories'

describe('proposedAddressesController', () => {
  let request: Request
  const response = mock<Response>({ locals: { user: { username: 'user1', token: 'token-1' } } })
  const next = mock<NextFunction>()

  const auditService = mock<AuditService>()
  const proposedAddressesService = mock<ProposedAddressesService>()
  const casesService = mock<CasesService>()
  const sessionData: ProposedAddressFormData = {
    flow: 'full',
    address: {
      buildingName: 'Line 1',
      subBuildingName: 'Line 2',
      postTown: 'Town',
      county: 'Region',
      postcode: 'AB1 2CD',
      country: 'UK',
    },
    arrangementType: 'PRIVATE',
    arrangementSubType: 'FRIENDS_OR_FAMILY',
    arrangementSubTypeDescription: '',
    settledType: 'SETTLED',
    verificationStatus: 'PASSED',
    nextAccommodationStatus: 'YES',
  }

  let controller: ProposedAddressesController

  beforeEach(() => {
    jest.clearAllMocks()

    casesService.getCase.mockResolvedValue({ name: 'James Smith' })

    request = mock<Request>({
      id: 'request-id',
      params: { crn: 'CRN123' },
      session: {
        multiPageFormData: {
          proposedAddress: {},
        },
        save: jest.fn().mockImplementation((callback: () => unknown) => callback()),
      },
    })

    controller = new ProposedAddressesController(auditService, proposedAddressesService, casesService)
    jest.spyOn(validationUtils, 'fetchErrors').mockReturnValue({ errors: {}, errorSummary: [] })
    jest.spyOn(proposedAddressesUtils, 'arrangementSubTypeItems').mockReturnValue([])
    jest.spyOn(proposedAddressesUtils, 'verificationStatusItems').mockReturnValue([])
    jest.spyOn(proposedAddressesUtils, 'nextAccommodationStatusItems').mockReturnValue([])

    jest.spyOn(controller.formData, 'remove')
  })

  describe('start', () => {
    it('redirects to details', async () => {
      await controller.start()(request, response, next)

      expect(controller.formData.remove).toHaveBeenCalledWith('CRN123', request.session)
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.details({ crn: 'CRN123' }))
    })
  })

  describe('details', () => {
    it('renders details page', async () => {
      await controller.details()(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.ADD_PROPOSED_ADDRESS_DETAILS, {
        who: user.username,
        correlationId: 'request-id',
      })
      expect(response.render).toHaveBeenCalledWith('pages/proposed-address/details', {
        crn: 'CRN123',
        address: {},
        errors: {},
        errorSummary: [],
      })
    })

    it('renders details page with session data', async () => {
      request.session.multiPageFormData.proposedAddress.CRN123 = sessionData
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
      jest.spyOn(proposedAddressesUtils, 'updateAddressFromRequest').mockResolvedValue(sessionData)
      jest.spyOn(proposedAddressesUtils, 'validateUpToAddress').mockReturnValue(null)

      await controller.saveDetails()(request, response, next)

      expect(proposedAddressesUtils.updateAddressFromRequest).toHaveBeenCalledWith(request, controller.formData)
      expect(proposedAddressesUtils.validateUpToAddress).toHaveBeenCalledWith(request, sessionData)
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.type({ crn: 'CRN123' }))
    })

    it('redirects to details when address invalid', async () => {
      jest.spyOn(proposedAddressesUtils, 'updateAddressFromRequest').mockResolvedValue(sessionData)
      jest
        .spyOn(proposedAddressesUtils, 'validateUpToAddress')
        .mockReturnValue(uiPaths.proposedAddresses.details({ crn: 'CRN123' }))

      await controller.saveDetails()(request, response, next)

      expect(proposedAddressesUtils.updateAddressFromRequest).toHaveBeenCalledWith(request, controller.formData)
      expect(proposedAddressesUtils.validateUpToAddress).toHaveBeenCalledWith(request, sessionData)
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.details({ crn: 'CRN123' }))
    })
  })

  describe('type', () => {
    it('renders arrangement type page', async () => {
      request.session.multiPageFormData.proposedAddress.CRN123 = undefined
      jest.spyOn(proposedAddressesUtils, 'validateUpToAddress').mockReturnValue(null)
      await controller.type()(request, response, next)

      expect(proposedAddressesUtils.validateUpToAddress).toHaveBeenCalledWith(request, undefined)
      expect(auditService.logPageView).toHaveBeenCalledWith(Page.ADD_PROPOSED_ADDRESS_TYPE, {
        who: user.username,
        correlationId: 'request-id',
      })
      expect(response.render).toHaveBeenCalledWith('pages/proposed-address/type', {
        crn: 'CRN123',
        proposedAddress: undefined,
        name: 'James Smith',
        errors: {},
        errorSummary: [],
        arrangementSubTypeItems: [],
      })
    })

    it('renders arrangement type page with session data', async () => {
      request.session.multiPageFormData.proposedAddress.CRN123 = sessionData
      jest.spyOn(proposedAddressesUtils, 'validateUpToAddress').mockReturnValue(null)
      await controller.type()(request, response, next)

      expect(proposedAddressesUtils.validateUpToAddress).toHaveBeenCalledWith(request, sessionData)
      expect(response.render).toHaveBeenCalledWith('pages/proposed-address/type', {
        crn: 'CRN123',
        proposedAddress: sessionData,
        name: 'James Smith',
        errors: {},
        errorSummary: [],
        arrangementSubTypeItems: [],
      })
    })

    it('redirects when validation fails', async () => {
      request.session.multiPageFormData.proposedAddress.CRN123 = sessionData
      jest
        .spyOn(proposedAddressesUtils, 'validateUpToAddress')
        .mockReturnValue(uiPaths.proposedAddresses.details({ crn: 'CRN123' }))

      await controller.type()(request, response, next)

      expect(proposedAddressesUtils.validateUpToAddress).toHaveBeenCalledWith(request, sessionData)
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.details({ crn: 'CRN123' }))
      expect(auditService.logPageView).not.toHaveBeenCalled()
    })
  })

  describe('saveType', () => {
    it('redirects to status when arrangement type valid', async () => {
      jest.spyOn(proposedAddressesUtils, 'updateTypeFromRequest').mockResolvedValue(sessionData)
      jest.spyOn(proposedAddressesUtils, 'validateUpToType').mockReturnValue(null)

      await controller.saveType()(request, response, next)

      expect(proposedAddressesUtils.updateTypeFromRequest).toHaveBeenCalledWith(request, controller.formData)
      expect(proposedAddressesUtils.validateUpToType).toHaveBeenCalledWith(request, sessionData)
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.status({ crn: 'CRN123' }))
    })

    it('redirects to arrangement type when arrangement type invalid', async () => {
      jest.spyOn(proposedAddressesUtils, 'updateTypeFromRequest').mockResolvedValue(sessionData)
      jest
        .spyOn(proposedAddressesUtils, 'validateUpToType')
        .mockReturnValue(uiPaths.proposedAddresses.type({ crn: 'CRN123' }))

      await controller.saveType()(request, response, next)

      expect(proposedAddressesUtils.updateTypeFromRequest).toHaveBeenCalledWith(request, controller.formData)
      expect(proposedAddressesUtils.validateUpToType).toHaveBeenCalledWith(request, sessionData)
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.type({ crn: 'CRN123' }))
    })
  })

  describe('status', () => {
    it('renders status page', async () => {
      request.session.multiPageFormData.proposedAddress.CRN123 = undefined
      jest.spyOn(proposedAddressesUtils, 'validateUpToType').mockReturnValue(null)

      await controller.status()(request, response, next)

      expect(proposedAddressesUtils.validateUpToType).toHaveBeenCalledWith(request, undefined)
      expect(auditService.logPageView).toHaveBeenCalledWith(Page.ADD_PROPOSED_ADDRESS_STATUS, {
        who: user.username,
        correlationId: 'request-id',
      })
      expect(response.render).toHaveBeenCalledWith('pages/proposed-address/status', {
        crn: 'CRN123',
        proposedAddress: undefined,
        backLinkHref: '/cases/CRN123/proposed-addresses/type',
        errors: {},
        errorSummary: [],
        verificationStatusItems: [],
      })
    })

    it('renders status page with session data', async () => {
      request.session.multiPageFormData.proposedAddress.CRN123 = sessionData
      jest.spyOn(proposedAddressesUtils, 'validateUpToType').mockReturnValue(null)
      await controller.status()(request, response, next)

      expect(proposedAddressesUtils.validateUpToType).toHaveBeenCalledWith(request, sessionData)
      expect(response.render).toHaveBeenCalledWith('pages/proposed-address/status', {
        crn: 'CRN123',
        proposedAddress: sessionData,
        backLinkHref: '/cases/CRN123/proposed-addresses/type',
        errors: {},
        errorSummary: [],
        verificationStatusItems: [],
      })
    })

    it('redirects when validation fails', async () => {
      request.session.multiPageFormData.proposedAddress.CRN123 = sessionData
      jest
        .spyOn(proposedAddressesUtils, 'validateUpToType')
        .mockReturnValue(uiPaths.proposedAddresses.type({ crn: 'CRN123' }))

      await controller.status()(request, response, next)

      expect(proposedAddressesUtils.validateUpToType).toHaveBeenCalledWith(request, sessionData)
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.type({ crn: 'CRN123' }))
      expect(auditService.logPageView).not.toHaveBeenCalled()
    })
  })

  describe('saveStatus', () => {
    it('redirects to check your answers when status valid and status is not PASSED', async () => {
      jest.spyOn(proposedAddressesUtils, 'updateStatusFromRequest').mockResolvedValue({
        ...sessionData,
        verificationStatus: 'NOT_CHECKED_YET',
      })
      jest.spyOn(proposedAddressesUtils, 'validateUpToStatus').mockReturnValue(null)

      await controller.saveStatus()(request, response, next)

      expect(proposedAddressesUtils.updateStatusFromRequest).toHaveBeenCalledWith(request, controller.formData)
      expect(proposedAddressesUtils.validateUpToStatus).toHaveBeenCalledWith(request, {
        ...sessionData,
        verificationStatus: 'NOT_CHECKED_YET',
      })
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.checkYourAnswers({ crn: 'CRN123' }))
    })

    it('redirects to next accommodation when status is PASSED', async () => {
      request.session.multiPageFormData.proposedAddress.CRN123 = {
        ...sessionData,
        verificationStatus: 'PASSED',
      }
      jest.spyOn(proposedAddressesUtils, 'updateStatusFromRequest').mockResolvedValue(sessionData)
      jest.spyOn(proposedAddressesUtils, 'validateUpToStatus').mockReturnValue(null)

      await controller.saveStatus()(request, response, next)

      expect(proposedAddressesUtils.updateStatusFromRequest).toHaveBeenCalledWith(request, controller.formData)
      expect(proposedAddressesUtils.validateUpToStatus).toHaveBeenCalledWith(request, sessionData)
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.nextAccommodation({ crn: 'CRN123' }))
    })

    it('redirects to status when status invalid', async () => {
      jest.spyOn(proposedAddressesUtils, 'updateStatusFromRequest').mockResolvedValue(sessionData)
      jest
        .spyOn(proposedAddressesUtils, 'validateUpToStatus')
        .mockReturnValue(uiPaths.proposedAddresses.status({ crn: 'CRN123' }))

      await controller.saveStatus()(request, response, next)

      expect(proposedAddressesUtils.updateStatusFromRequest).toHaveBeenCalledWith(request, controller.formData)
      expect(proposedAddressesUtils.validateUpToStatus).toHaveBeenCalledWith(request, sessionData)
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.status({ crn: 'CRN123' }))
    })

    it('updates and redirects to profile tracker when flow is not "full" and status is not PASSED', async () => {
      jest.spyOn(proposedAddressesUtils, 'updateStatusFromRequest').mockResolvedValue({
        ...sessionData,
        flow: 'status',
        verificationStatus: 'NOT_CHECKED_YET',
      })
      jest.spyOn(proposedAddressesUtils, 'validateUpToStatus').mockReturnValue(null)

      await controller.saveStatus()(request, response, next)

      expect(proposedAddressesUtils.updateStatusFromRequest).toHaveBeenCalledWith(request, controller.formData)
      expect(proposedAddressesUtils.validateUpToStatus).toHaveBeenCalledWith(request, {
        ...sessionData,
        flow: 'status',
        verificationStatus: 'NOT_CHECKED_YET',
      })
      expect(proposedAddressesService.update).toHaveBeenCalledWith(
        'token-1',
        'CRN123',
        expect.objectContaining({ verificationStatus: 'NOT_CHECKED_YET' }),
      )
      expect(controller.formData.remove).toHaveBeenCalledWith('CRN123', request.session)
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.cases.show({ crn: 'CRN123' }))
    })
  })

  describe('nextAccommodation', () => {
    it('renders next accommodation page', async () => {
      jest.spyOn(proposedAddressesUtils, 'validateUpToStatus').mockReturnValue(null)
      request.session.multiPageFormData.proposedAddress.CRN123 = undefined

      await controller.nextAccommodation()(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.ADD_PROPOSED_ADDRESS_NEXT_ACCOMMODATION, {
        who: user.username,
        correlationId: 'request-id',
      })
      expect(proposedAddressesUtils.validateUpToStatus).toHaveBeenCalledWith(request, undefined)
      expect(response.render).toHaveBeenCalledWith('pages/proposed-address/next-accommodation', {
        crn: 'CRN123',
        proposedAddress: undefined,
        nextAccommodationStatusItems: [],
        name: 'James Smith',
        backLinkHref: '/cases/CRN123/proposed-addresses/status',
        errors: {},
        errorSummary: [],
      })
    })

    it('renders next accommodation page with session data', async () => {
      jest.spyOn(proposedAddressesUtils, 'validateUpToStatus').mockReturnValue(null)
      request.session.multiPageFormData.proposedAddress.CRN123 = sessionData

      await controller.nextAccommodation()(request, response, next)

      expect(proposedAddressesUtils.validateUpToStatus).toHaveBeenCalledWith(request, sessionData)
      expect(response.render).toHaveBeenCalledWith('pages/proposed-address/next-accommodation', {
        crn: 'CRN123',
        proposedAddress: sessionData,
        name: 'James Smith',
        nextAccommodationStatusItems: [],
        backLinkHref: '/cases/CRN123/proposed-addresses/status',
        errors: {},
        errorSummary: [],
      })
    })

    it('redirects when validation fails', async () => {
      request.session.multiPageFormData.proposedAddress.CRN123 = sessionData
      jest
        .spyOn(proposedAddressesUtils, 'validateUpToStatus')
        .mockReturnValue(uiPaths.proposedAddresses.status({ crn: 'CRN123' }))

      await controller.nextAccommodation()(request, response, next)

      expect(proposedAddressesUtils.validateUpToStatus).toHaveBeenCalledWith(request, sessionData)
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.status({ crn: 'CRN123' }))
      expect(auditService.logPageView).not.toHaveBeenCalled()
    })
  })

  describe('saveNextAccommodation', () => {
    it('redirects to check your answers when next accommodation valid', async () => {
      jest.spyOn(proposedAddressesUtils, 'updateNextAccommodationFromRequest').mockResolvedValue(sessionData)
      jest.spyOn(proposedAddressesUtils, 'validateUpToNextAccommodation').mockReturnValue(null)

      await controller.saveNextAccommodation()(request, response, next)
      expect(proposedAddressesUtils.updateNextAccommodationFromRequest).toHaveBeenCalledWith(
        request,
        controller.formData,
      )
      expect(proposedAddressesUtils.validateUpToNextAccommodation).toHaveBeenCalledWith(request, sessionData)
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.checkYourAnswers({ crn: 'CRN123' }))
    })

    it('redirects to next accommodation when next accommodation invalid', async () => {
      jest.spyOn(proposedAddressesUtils, 'updateNextAccommodationFromRequest').mockResolvedValue(sessionData)
      jest
        .spyOn(proposedAddressesUtils, 'validateUpToNextAccommodation')
        .mockReturnValue(uiPaths.proposedAddresses.nextAccommodation({ crn: 'CRN123' }))

      await controller.saveNextAccommodation()(request, response, next)

      expect(proposedAddressesUtils.updateNextAccommodationFromRequest).toHaveBeenCalledWith(
        request,
        controller.formData,
      )
      expect(proposedAddressesUtils.validateUpToNextAccommodation).toHaveBeenCalledWith(request, sessionData)
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.nextAccommodation({ crn: 'CRN123' }))
    })

    it('updates and redirects to profile tracker when flow is not "full"', async () => {
      jest.spyOn(proposedAddressesUtils, 'updateNextAccommodationFromRequest').mockResolvedValue({
        ...sessionData,
        flow: 'nextAccommodation',
      })
      jest.spyOn(proposedAddressesUtils, 'validateUpToNextAccommodation').mockReturnValue(null)

      await controller.saveNextAccommodation()(request, response, next)

      expect(proposedAddressesUtils.updateNextAccommodationFromRequest).toHaveBeenCalledWith(
        request,
        controller.formData,
      )
      expect(proposedAddressesUtils.validateUpToNextAccommodation).toHaveBeenCalledWith(request, {
        ...sessionData,
        flow: 'nextAccommodation',
      })
      expect(proposedAddressesService.update).toHaveBeenCalledWith(
        'token-1',
        'CRN123',
        expect.objectContaining({ nextAccommodationStatus: 'YES' }),
      )
      expect(controller.formData.remove).toHaveBeenCalledWith('CRN123', request.session)
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.cases.show({ crn: 'CRN123' }))
    })
  })

  describe('checkYourAnswers', () => {
    it('renders check your answers', async () => {
      jest
        .spyOn(proposedAddressesUtils, 'summaryListRows')
        .mockImplementation(() => [
          { key: { text: 'Address' }, value: { html: 'Line 1<br />Line 2' }, actions: { items: [] } },
        ])
      jest.spyOn(proposedAddressesUtils, 'validateUpToNextAccommodation').mockReturnValue(null)
      request.session.multiPageFormData.proposedAddress.CRN123 = sessionData

      await controller.checkYourAnswers()(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.ADD_PROPOSED_ADDRESS_CHECK_YOUR_ANSWERS, {
        who: user.username,
        correlationId: 'request-id',
      })
      expect(proposedAddressesUtils.validateUpToNextAccommodation).toHaveBeenCalledWith(request, sessionData)
      expect(response.render).toHaveBeenCalledWith('pages/proposed-address/check-your-answers', {
        crn: 'CRN123',
        tableRows: [{ key: { text: 'Address' }, value: { html: 'Line 1<br />Line 2' }, actions: { items: [] } }],
        backLinkHref: uiPaths.proposedAddresses.nextAccommodation({ crn: 'CRN123' }),
        errors: {},
        errorSummary: [],
      })
    })

    it('redirects when validation fails', async () => {
      request.session.multiPageFormData.proposedAddress.CRN123 = sessionData
      jest
        .spyOn(proposedAddressesUtils, 'validateUpToNextAccommodation')
        .mockReturnValue(uiPaths.proposedAddresses.nextAccommodation({ crn: 'CRN123' }))

      await controller.checkYourAnswers()(request, response, next)

      expect(proposedAddressesUtils.validateUpToNextAccommodation).toHaveBeenCalledWith(request, sessionData)
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.nextAccommodation({ crn: 'CRN123' }))
      expect(auditService.logPageView).not.toHaveBeenCalled()
    })
  })

  describe('submit', () => {
    it('submits, clears session data and redirects', async () => {
      request.session.multiPageFormData.proposedAddress.CRN123 = sessionData
      jest.spyOn(proposedAddressesUtils, 'validateUpToNextAccommodation').mockReturnValue(null)

      await controller.submit()(request, response, next)

      expect(proposedAddressesService.submit).toHaveBeenCalledWith('token-1', 'CRN123', sessionData)
      expect(proposedAddressesUtils.validateUpToNextAccommodation).toHaveBeenCalledWith(request, sessionData)
      expect(controller.formData.remove).toHaveBeenCalledWith('CRN123', request.session)
      expect(request.flash).toHaveBeenCalledWith('success', 'Private address added')
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.cases.show({ crn: 'CRN123' }))
    })

    it('redirects when validation fails', async () => {
      request.session.multiPageFormData.proposedAddress.CRN123 = sessionData
      jest
        .spyOn(proposedAddressesUtils, 'validateUpToNextAccommodation')
        .mockReturnValue(uiPaths.proposedAddresses.checkYourAnswers({ crn: 'CRN123' }))

      await controller.submit()(request, response, next)

      expect(proposedAddressesUtils.validateUpToNextAccommodation).toHaveBeenCalledWith(request, sessionData)
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.checkYourAnswers({ crn: 'CRN123' }))
      expect(proposedAddressesService.submit).not.toHaveBeenCalled()
      expect(controller.formData.remove).not.toHaveBeenCalled()
      expect(auditService.logPageView).not.toHaveBeenCalled()
    })

    it('redirects when api call fails', async () => {
      request.session.multiPageFormData.proposedAddress.CRN123 = sessionData
      jest.spyOn(proposedAddressesUtils, 'validateUpToNextAccommodation').mockReturnValue(null)
      jest.spyOn(proposedAddressesService, 'submit').mockRejectedValue(new Error('API error'))
      jest.spyOn(controller.formData, 'remove')

      await controller.submit()(request, response, next)

      expect(proposedAddressesService.submit).toHaveBeenCalledWith('token-1', 'CRN123', sessionData)
      expect(proposedAddressesUtils.validateUpToNextAccommodation).toHaveBeenCalledWith(request, sessionData)
      expect(controller.formData.remove).not.toHaveBeenCalled()
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.checkYourAnswers({ crn: 'CRN123' }))
      expect(auditService.logPageView).not.toHaveBeenCalled()
    })
  })

  describe('edit', () => {
    it.each([
      { flow: 'details', redirect: uiPaths.proposedAddresses.details },
      { flow: 'type', redirect: uiPaths.proposedAddresses.type },
      { flow: 'status', redirect: uiPaths.proposedAddresses.status },
      { flow: 'nextAccommodation', redirect: uiPaths.proposedAddresses.nextAccommodation },
    ])('redirects to the $flow page when flow is "$flow"', async ({ flow, redirect }) => {
      request.query.flow = flow
      request.params.id = 'address-id'
      const proposedAddress = accommodationFactory.build({ crn: 'CRN123', id: 'address-id' })
      proposedAddressesService.getProposedAddress.mockResolvedValue(proposedAddress)

      jest.spyOn(controller.formData, 'update')

      await controller.edit()(request, response, next)

      expect(controller.formData.remove).toHaveBeenCalled()
      expect(proposedAddressesService.getProposedAddress).toHaveBeenCalledWith('token-1', 'CRN123', 'address-id')
      expect(controller.formData.update).toHaveBeenCalledWith(
        'CRN123',
        request.session,
        expect.objectContaining({
          flow,
        }),
      )
      expect(response.redirect).toHaveBeenCalledWith(redirect({ crn: 'CRN123' }))
    })

    it('redirects to profile tracker when flow is missing', async () => {
      request.params.id = 'address-id'
      request.query.flow = null

      jest.spyOn(controller.formData, 'update')

      await controller.edit()(request, response, next)

      expect(controller.formData.remove).not.toHaveBeenCalled()
      expect(proposedAddressesService.getProposedAddress).not.toHaveBeenCalled()
      expect(controller.formData.update).not.toHaveBeenCalled()
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
