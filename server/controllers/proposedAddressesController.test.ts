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
import * as backlinks from '../utils/backlinks'
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
    nameOrNumber: 'BUILDING NAME',
    postcode: 'AB12CD',
    address: {
      buildingName: 'Building name',
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
    jest.restoreAllMocks()
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
    jest.spyOn(validationUtils, 'validateAndFlashErrors')

    jest.spyOn(controller.formData, 'remove')

    jest.spyOn(backlinks, 'getPageBackLink').mockReturnValue(uiPaths.cases.show({ crn: 'CRN123' }))
  })

  describe('start', () => {
    it('redirects to address lookup', async () => {
      await controller.start()(request, response, next)

      expect(controller.formData.remove).toHaveBeenCalledWith('CRN123', request.session)
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.lookup({ crn: 'CRN123' }))
    })
  })

  describe('lookup', () => {
    it('renders the address lookup page', async () => {
      await controller.lookup()(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.ADD_PROPOSED_ADDRESS_LOOKUP, {
        who: user.username,
        correlationId: 'request-id',
      })
      expect(response.render).toHaveBeenCalledWith('pages/proposed-address/lookup', {
        crn: 'CRN123',
        errors: {},
        errorSummary: [],
      })
    })

    it('renders the address lookup page with errors and session data', async () => {
      request.session.multiPageFormData.proposedAddress.CRN123 = {
        flow: 'full',
        nameOrNumber: '',
        postcode: 'H23 8TY',
      }
      const errors = { nameOrNumber: 'Enter a property name or number' }
      const errorSummary = [{ href: '#nameOrNumber', text: 'Enter a property name or number' }]

      jest.spyOn(validationUtils, 'fetchErrors').mockReturnValue({ errors, errorSummary })

      await controller.lookup()(request, response, next)

      expect(response.render).toHaveBeenCalledWith('pages/proposed-address/lookup', {
        crn: 'CRN123',
        nameOrNumber: '',
        postcode: 'H23 8TY',
        errors,
        errorSummary,
      })
    })
  })

  describe('saveLookup', () => {
    it('redirects with errors if the submitted data is invalid', async () => {
      request.body = { nameOrNumber: '', postcode: '' }
      await controller.saveLookup()(request, response, next)

      expect(validationUtils.validateAndFlashErrors).toHaveBeenCalledWith(request, {
        nameOrNumber: 'Enter a property name or number',
        postcode: 'Enter a UK postcode',
      })
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.lookup({ crn: 'CRN123' }))
    })

    it('redirects to address details if there are no results', async () => {
      request.body = { nameOrNumber: '123', postcode: 'F45 6RT' }

      await controller.saveLookup()(request, response, next)

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
          buildingName: 'Building name',
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
      request.session.multiPageFormData.proposedAddress.CRN123 = sessionData
      request.body = {
        addressLine1: 'Line 1',
        addressLine2: 'Line 2',
        addressTown: 'Town',
        addressCounty: 'Region',
        addressPostcode: 'AB1 2CD',
        addressCountry: 'UK',
      }

      await controller.saveDetails()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.type({ crn: 'CRN123' }))
    })

    it('redirects to details when address invalid', async () => {
      await controller.saveDetails()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.details({ crn: 'CRN123' }))
    })
  })

  describe('type', () => {
    it('renders arrangement type page', async () => {
      request.session.multiPageFormData.proposedAddress.CRN123 = {
        ...sessionData,
        arrangementSubType: undefined,
        settledType: undefined,
      }

      await controller.type()(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.ADD_PROPOSED_ADDRESS_TYPE, {
        who: user.username,
        correlationId: 'request-id',
      })
      expect(response.render).toHaveBeenCalledWith('pages/proposed-address/type', {
        crn: 'CRN123',
        proposedAddress: { ...sessionData, arrangementSubType: undefined, settledType: undefined },
        name: 'James Smith',
        errors: {},
        errorSummary: [],
        arrangementSubTypeItems: expect.any(Array),
      })
    })

    it('renders arrangement type page with session data', async () => {
      request.session.multiPageFormData.proposedAddress.CRN123 = sessionData
      await controller.type()(request, response, next)

      expect(response.render).toHaveBeenCalledWith('pages/proposed-address/type', {
        crn: 'CRN123',
        proposedAddress: sessionData,
        name: 'James Smith',
        errors: {},
        errorSummary: [],
        arrangementSubTypeItems: expect.any(Array),
      })
    })

    it('redirects when validation fails', async () => {
      request.session.multiPageFormData.proposedAddress.CRN123 = undefined

      await controller.type()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.details({ crn: 'CRN123' }))
      expect(auditService.logPageView).not.toHaveBeenCalled()
    })
  })

  describe('saveType', () => {
    it('redirects to status when arrangement type valid', async () => {
      request.session.multiPageFormData.proposedAddress.CRN123 = sessionData
      request.body = {
        arrangementSubType: 'FRIENDS_OR_FAMILY',
        settledType: 'SETTLED',
      }

      await controller.saveType()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.status({ crn: 'CRN123' }))
    })

    it('redirects to arrangement type when arrangement type invalid', async () => {
      request.session.multiPageFormData.proposedAddress.CRN123 = sessionData

      await controller.saveType()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.type({ crn: 'CRN123' }))
    })
  })

  describe('status', () => {
    it('renders status page', async () => {
      request.session.multiPageFormData.proposedAddress.CRN123 = { ...sessionData, verificationStatus: undefined }
      jest.spyOn(backlinks, 'getPageBackLink').mockReturnValue(uiPaths.proposedAddresses.type({ crn: 'CRN123' }))

      await controller.status()(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.ADD_PROPOSED_ADDRESS_STATUS, {
        who: user.username,
        correlationId: 'request-id',
      })
      expect(response.render).toHaveBeenCalledWith('pages/proposed-address/status', {
        crn: 'CRN123',
        proposedAddress: { ...sessionData, verificationStatus: undefined },
        backLinkHref: '/cases/CRN123/proposed-addresses/type',
        errors: {},
        errorSummary: [],
        verificationStatusItems: expect.any(Array),
      })
    })

    it('renders status page with session data', async () => {
      request.session.multiPageFormData.proposedAddress.CRN123 = sessionData
      jest.spyOn(backlinks, 'getPageBackLink').mockReturnValue(uiPaths.proposedAddresses.type({ crn: 'CRN123' }))
      await controller.status()(request, response, next)

      expect(response.render).toHaveBeenCalledWith('pages/proposed-address/status', {
        crn: 'CRN123',
        proposedAddress: sessionData,
        backLinkHref: '/cases/CRN123/proposed-addresses/type',
        errors: {},
        errorSummary: [],
        verificationStatusItems: expect.any(Array),
      })
    })

    it('redirects when validation fails', async () => {
      request.session.multiPageFormData.proposedAddress.CRN123 = { ...sessionData, arrangementSubType: undefined }

      await controller.status()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.type({ crn: 'CRN123' }))
      expect(auditService.logPageView).not.toHaveBeenCalled()
    })
  })

  describe('saveStatus', () => {
    it('redirects to check your answers when status valid and status is not PASSED', async () => {
      request.session.multiPageFormData.proposedAddress.CRN123 = sessionData
      request.body = { verificationStatus: 'NOT_CHECKED_YET' }

      await controller.saveStatus()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.checkYourAnswers({ crn: 'CRN123' }))
    })

    it('redirects to next accommodation when status is PASSED', async () => {
      request.session.multiPageFormData.proposedAddress.CRN123 = sessionData
      request.body = { verificationStatus: 'PASSED' }

      await controller.saveStatus()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.nextAccommodation({ crn: 'CRN123' }))
    })

    it('redirects to status when status invalid', async () => {
      request.session.multiPageFormData.proposedAddress.CRN123 = sessionData

      await controller.saveStatus()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.status({ crn: 'CRN123' }))
    })

    it('updates and redirects to profile tracker when flow is not "full" and status is not PASSED', async () => {
      request.session.multiPageFormData.proposedAddress.CRN123 = { ...sessionData, flow: 'status' }
      request.body = { verificationStatus: 'NOT_CHECKED_YET' }

      await controller.saveStatus()(request, response, next)

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
      jest.spyOn(backlinks, 'getPageBackLink').mockReturnValue(uiPaths.proposedAddresses.status({ crn: 'CRN123' }))
      request.session.multiPageFormData.proposedAddress.CRN123 = { ...sessionData, nextAccommodationStatus: undefined }

      await controller.nextAccommodation()(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.ADD_PROPOSED_ADDRESS_NEXT_ACCOMMODATION, {
        who: user.username,
        correlationId: 'request-id',
      })
      expect(response.render).toHaveBeenCalledWith('pages/proposed-address/next-accommodation', {
        crn: 'CRN123',
        proposedAddress: { ...sessionData, nextAccommodationStatus: undefined },
        nextAccommodationStatusItems: expect.any(Array),
        name: 'James Smith',
        backLinkHref: '/cases/CRN123/proposed-addresses/status',
        errors: {},
        errorSummary: [],
      })
    })

    it('renders next accommodation page with session data', async () => {
      jest.spyOn(backlinks, 'getPageBackLink').mockReturnValue(uiPaths.proposedAddresses.status({ crn: 'CRN123' }))
      request.session.multiPageFormData.proposedAddress.CRN123 = sessionData

      await controller.nextAccommodation()(request, response, next)

      expect(response.render).toHaveBeenCalledWith('pages/proposed-address/next-accommodation', {
        crn: 'CRN123',
        proposedAddress: sessionData,
        name: 'James Smith',
        nextAccommodationStatusItems: expect.any(Array),
        backLinkHref: '/cases/CRN123/proposed-addresses/status',
        errors: {},
        errorSummary: [],
      })
    })

    it('redirects when validation fails', async () => {
      request.session.multiPageFormData.proposedAddress.CRN123 = { ...sessionData, verificationStatus: undefined }

      await controller.nextAccommodation()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.status({ crn: 'CRN123' }))
      expect(auditService.logPageView).not.toHaveBeenCalled()
    })
  })

  describe('saveNextAccommodation', () => {
    it('redirects to check your answers when next accommodation valid', async () => {
      request.session.multiPageFormData.proposedAddress.CRN123 = sessionData
      request.body = { nextAccommodationStatus: 'YES' }

      await controller.saveNextAccommodation()(request, response, next)
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.checkYourAnswers({ crn: 'CRN123' }))
    })

    it('redirects to next accommodation when next accommodation invalid', async () => {
      request.session.multiPageFormData.proposedAddress.CRN123 = {
        ...sessionData,
        verificationStatus: 'PASSED',
        nextAccommodationStatus: undefined,
      }

      await controller.saveNextAccommodation()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.nextAccommodation({ crn: 'CRN123' }))
    })

    it('updates and redirects to profile tracker when flow is not "full"', async () => {
      request.session.multiPageFormData.proposedAddress.CRN123 = { ...sessionData, flow: 'nextAccommodation' }
      request.body = { nextAccommodationStatus: 'YES' }

      await controller.saveNextAccommodation()(request, response, next)

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
      jest
        .spyOn(backlinks, 'getPageBackLink')
        .mockReturnValue(uiPaths.proposedAddresses.nextAccommodation({ crn: 'CRN123' }))
      request.session.multiPageFormData.proposedAddress.CRN123 = sessionData

      await controller.checkYourAnswers()(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.ADD_PROPOSED_ADDRESS_CHECK_YOUR_ANSWERS, {
        who: user.username,
        correlationId: 'request-id',
      })
      expect(response.render).toHaveBeenCalledWith('pages/proposed-address/check-your-answers', {
        crn: 'CRN123',
        tableRows: [{ key: { text: 'Address' }, value: { html: 'Line 1<br />Line 2' }, actions: { items: [] } }],
        backLinkHref: uiPaths.proposedAddresses.nextAccommodation({ crn: 'CRN123' }),
        errors: {},
        errorSummary: [],
      })
    })

    it('redirects when validation fails', async () => {
      request.session.multiPageFormData.proposedAddress.CRN123 = { ...sessionData, nextAccommodationStatus: undefined }

      await controller.checkYourAnswers()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.nextAccommodation({ crn: 'CRN123' }))
      expect(auditService.logPageView).not.toHaveBeenCalled()
    })
  })

  describe('submit', () => {
    it('submits, clears session data and redirects', async () => {
      request.session.multiPageFormData.proposedAddress.CRN123 = sessionData

      await controller.submit()(request, response, next)

      expect(proposedAddressesService.submit).toHaveBeenCalledWith('token-1', 'CRN123', sessionData)
      expect(controller.formData.remove).toHaveBeenCalledWith('CRN123', request.session)
      expect(request.flash).toHaveBeenCalledWith('success', 'Private address added')
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.cases.show({ crn: 'CRN123' }))
    })

    it('redirects when validation fails', async () => {
      request.session.multiPageFormData.proposedAddress.CRN123 = { ...sessionData, nextAccommodationStatus: undefined }

      await controller.submit()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.nextAccommodation({ crn: 'CRN123' }))
      expect(proposedAddressesService.submit).not.toHaveBeenCalled()
      expect(controller.formData.remove).not.toHaveBeenCalled()
      expect(auditService.logPageView).not.toHaveBeenCalled()
    })

    it('redirects when api call fails', async () => {
      request.session.multiPageFormData.proposedAddress.CRN123 = sessionData
      jest.spyOn(proposedAddressesService, 'submit').mockRejectedValue(new Error('API error'))

      await controller.submit()(request, response, next)

      expect(proposedAddressesService.submit).toHaveBeenCalledWith('token-1', 'CRN123', sessionData)
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
