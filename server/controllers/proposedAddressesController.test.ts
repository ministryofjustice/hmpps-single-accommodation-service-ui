import { NextFunction, Request, Response } from 'express'
import { mock } from 'jest-mock-extended'
import { ProposedAddressFormData } from '@sas/ui'
import ProposedAddressesController from './proposedAddressesController'
import AuditService, { Page } from '../services/auditService'
import ProposedAddressesService from '../services/proposedAddressesService'
import uiPaths from '../paths/ui'
import { user } from '../routes/testutils/appSetup'
import * as proposedAddressesUtils from '../utils/proposedAddresses'
import {
  addressDetailRows,
  addressTimelineEntry,
  accommodationTypeItems,
  checkYourAnswersRows,
  lookupResultsItems,
  nextAccommodationStatusItems,
  nextActionButton,
  verificationStatusItems,
} from '../utils/proposedAddresses'
import * as validationUtils from '../utils/validation'
import * as backlinks from '../utils/backlinks'
import CasesService from '../services/casesService'
import {
  addressFactory,
  apiResponseFactory,
  auditRecordFactory,
  caseFactory,
  proposedAccommodationFactory,
  proposedAddressFormFactory,
  referenceDataFactory,
} from '../testutils/factories'
import OsDataHubService from '../services/osDataHubService'
import { formatAddress } from '../utils/addresses'
import { caseAssignedTo } from '../utils/cases'
import ReferenceDataService from '../services/referenceDataService'

describe('proposedAddressesController', () => {
  let request: Request
  const response = mock<Response>({ locals: { user: { userId: 'user-id', username: 'user1', token: 'token-1' } } })
  const next = mock<NextFunction>()

  const auditService = mock<AuditService>()
  const proposedAddressesService = mock<ProposedAddressesService>()
  const casesService = mock<CasesService>()
  const osDataHubService = mock<OsDataHubService>()
  const referenceDataService = mock<ReferenceDataService>()

  const accommodationTypes = [
    referenceDataFactory.build({ code: 'A40', name: 'A40 - Apartment' }),
    referenceDataFactory.build({ code: 'A45', name: 'A45 - Hostel' }),
  ]

  const nameOrNumber = '123'
  const postcode = 'AB12CD'
  const lookupResults = addressFactory.buildList(3)
  const address = {
    uprn: '1234567890',
    buildingName: 'Building name',
    subBuildingName: 'Line 2',
    postTown: 'Town',
    county: 'Region',
    postcode: 'AB1 2CD',
    country: 'UK',
  }
  const accommodationTypeCode = 'A45'
  const verificationStatus = 'PASSED' as const
  const nextAccommodationStatus = 'YES' as const

  const fullSessionData = proposedAddressFormFactory.build({
    nameOrNumber,
    postcode,
    lookupResults,
    address,
    accommodationTypeCode,
    verificationStatus,
    nextAccommodationStatus,
  })

  let controller: ProposedAddressesController

  const setSessionData = (data: Partial<ProposedAddressFormData>) => {
    request.session.multiPageFormData = {
      proposedAddress: {
        CRN123: data,
      },
    }
  }

  beforeEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()

    casesService.getCase.mockResolvedValue(apiResponseFactory.case({ name: 'James Smith', actions: [] }))
    referenceDataService.getAccommodationTypes.mockResolvedValue(apiResponseFactory.referenceData(accommodationTypes))

    request = mock<Request>({
      id: 'request-id',
      params: { crn: 'CRN123', id: 'address-id' },
      session: {
        save: jest.fn().mockImplementation((callback: () => unknown) => callback()),
      },
    })

    controller = new ProposedAddressesController(
      auditService,
      proposedAddressesService,
      casesService,
      osDataHubService,
      referenceDataService,
    )
    jest
      .spyOn(validationUtils, 'fetchErrorsAndUserInput')
      .mockReturnValue({ errors: {}, errorSummary: [], userInput: {} })
    jest.spyOn(validationUtils, 'validateAndFlashErrors')
    jest.spyOn(validationUtils, 'addGenericErrorToFlash')
    jest.spyOn(validationUtils, 'addUserInputToFlash')

    jest.spyOn(controller.formData, 'remove')
    jest.spyOn(controller.formData, 'update')

    jest.spyOn(backlinks, 'getPageBackLink').mockReturnValue(uiPaths.cases.show({ crn: 'CRN123' }))
  })

  describe('show', () => {
    const caseData = caseFactory.build()
    const proposedAddress = proposedAccommodationFactory.build({
      verificationStatus: 'PASSED',
    })
    const auditRecords = auditRecordFactory.buildList(2)

    beforeEach(() => {
      casesService.getCase.mockResolvedValue(apiResponseFactory.case(caseData))
      proposedAddressesService.getProposedAddress.mockResolvedValue(apiResponseFactory.proposedAddress(proposedAddress))
      proposedAddressesService.getTimeline.mockResolvedValue(apiResponseFactory.auditRecords(auditRecords))
    })

    it('renders the address details page', async () => {
      await controller.show()(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.PROPOSED_ADDRESS_DETAILS, {
        who: user.username,
        correlationId: 'request-id',
      })
      expect(response.render).toHaveBeenCalledWith('pages/proposed-address/show', {
        caseData,
        assignedTo: caseAssignedTo(caseData, user.username),
        address: formatAddress(proposedAddress.address),
        addressDetailRows: addressDetailRows(proposedAddress),
        timeline: auditRecords.map(addressTimelineEntry),
        nextAction: nextActionButton(proposedAddress),
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
        'pages/proposed-address/show',
        expect.objectContaining({
          errors,
          errorSummary,
          note: userInput.note,
        }),
      )
    })
  })

  describe('saveNote', () => {
    it('redirects with an error if the note is empty', async () => {
      request.body = { note: '' }

      await controller.saveNote()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(
        uiPaths.proposedAddresses.show({ crn: 'CRN123', id: 'address-id' }),
      )
      expect(validationUtils.validateAndFlashErrors).toHaveBeenCalledWith(request, {
        note: 'Enter a note',
      })
    })

    it('redirects with an error if the API returns an error', async () => {
      proposedAddressesService.submitTimelineNote.mockRejectedValue(new Error('API error'))

      request.body = { note: 'Some valid note' }

      await controller.saveNote()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(
        uiPaths.proposedAddresses.show({ crn: 'CRN123', id: 'address-id' }),
      )
      expect(validationUtils.addGenericErrorToFlash).toHaveBeenCalledWith(request, 'API error')
      expect(validationUtils.addUserInputToFlash).toHaveBeenCalledWith(request)
    })

    it('saves the note and redirects to the address details page with a success message', async () => {
      proposedAddressesService.submitTimelineNote.mockResolvedValue()

      request.body = { note: 'Some valid note' }

      await controller.saveNote()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(
        uiPaths.proposedAddresses.show({ crn: 'CRN123', id: 'address-id' }),
      )
      expect(request.flash).toHaveBeenCalledWith('success', 'Note added')
      expect(proposedAddressesService.submitTimelineNote).toHaveBeenCalledWith('token-1', 'CRN123', 'address-id', {
        note: 'Some valid note',
      })
    })
  })

  describe('start', () => {
    it('redirects to address lookup after setting up the session', async () => {
      await controller.start()(request, response, next)

      expect(controller.formData.remove).toHaveBeenCalledWith('CRN123', request.session)
      expect(controller.formData.update).toHaveBeenCalledWith('CRN123', request.session, {})
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.lookup({ crn: 'CRN123' }))
    })
  })

  describe('lookup', () => {
    it('renders the address lookup page', async () => {
      setSessionData({})

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
      setSessionData({ nameOrNumber: '', postcode: 'H23 8TY' })

      const errors = { nameOrNumber: 'Enter a property name or number' }
      const errorSummary = [{ href: '#nameOrNumber', text: 'Enter a property name or number' }]

      jest.spyOn(validationUtils, 'fetchErrorsAndUserInput').mockReturnValue({ errors, errorSummary, userInput: {} })

      await controller.lookup()(request, response, next)

      expect(response.render).toHaveBeenCalledWith('pages/proposed-address/lookup', {
        crn: 'CRN123',
        nameOrNumber: '',
        postcode: 'H23 8TY',
        errors,
        errorSummary,
      })
    })

    it('redirects to the Case details page if there is no session data', async () => {
      await controller.lookup()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(uiPaths.cases.show({ crn: 'CRN123' }))
    })
  })

  describe('saveLookup', () => {
    beforeEach(() => {
      setSessionData({})
    })

    it('redirects with errors if the submitted data is invalid', async () => {
      request.body = { nameOrNumber: '', postcode: '' }
      await controller.saveLookup()(request, response, next)

      expect(validationUtils.validateAndFlashErrors).toHaveBeenCalledWith(request, {
        nameOrNumber: 'Enter a property name or number',
        postcode: 'Enter a UK postcode',
      })
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.lookup({ crn: 'CRN123' }))
      expect(controller.formData.update).toHaveBeenCalledTimes(1)
      expect(controller.formData.update).toHaveBeenLastCalledWith('CRN123', request.session, {
        nameOrNumber: '',
        postcode: '',
        lookupResults: null,
      })
    })

    it('redirects with a generic error if there are no results', async () => {
      osDataHubService.getByNameOrNumberAndPostcode.mockResolvedValue([])

      request.body = { nameOrNumber: '456', postcode: 'N0 0PE' }

      await controller.saveLookup()(request, response, next)

      expect(validationUtils.addGenericErrorToFlash).toHaveBeenCalledWith(
        request,
        'No addresses found for this property name or number and UK postcode',
      )
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.lookup({ crn: 'CRN123' }))
      expect(controller.formData.update).toHaveBeenCalledTimes(1)
    })

    it('fetches lookup results, saves them to session and redirects to select address if the submitted data is valid', async () => {
      osDataHubService.getByNameOrNumberAndPostcode.mockResolvedValue(lookupResults)

      request.body = { nameOrNumber: '123', postcode: 'F45 6RT' }

      await controller.saveLookup()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.selectAddress({ crn: 'CRN123' }))
      expect(controller.formData.update).toHaveBeenCalledTimes(2)
      expect(controller.formData.update).toHaveBeenLastCalledWith('CRN123', request.session, {
        lookupResults,
      })
    })

    it('saves the address and redirects to the type page if there is exactly one result', async () => {
      osDataHubService.getByNameOrNumberAndPostcode.mockResolvedValue([lookupResults[1]])

      request.body = { nameOrNumber: '23A', postcode: 'M21 0BP' }

      await controller.saveLookup()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.type({ crn: 'CRN123' }))
      expect(controller.formData.update).toHaveBeenCalledTimes(2)
      expect(controller.formData.update).toHaveBeenLastCalledWith('CRN123', request.session, {
        lookupResults: [lookupResults[1]],
        address: lookupResults[1],
      })
    })
  })

  describe('selectAddress', () => {
    it('renders the select address page with results from the session', async () => {
      setSessionData({
        nameOrNumber,
        postcode,
        lookupResults,
        address,
      })

      await controller.selectAddress()(request, response, next)

      expect(response.render).toHaveBeenCalledWith('pages/proposed-address/select-address', {
        crn: 'CRN123',
        nameOrNumber,
        postcode,
        addresses: lookupResultsItems(lookupResults, address.uprn),
        errors: {},
        errorSummary: [],
      })
    })

    it('redirects to the lookup page if there are no lookup results in the session', async () => {
      setSessionData({
        nameOrNumber,
        postcode,
        lookupResults: null,
      })

      await controller.selectAddress()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.lookup({ crn: 'CRN123' }))
    })

    it('redirects to the Case details page if there is no session data', async () => {
      await controller.selectAddress()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(uiPaths.cases.show({ crn: 'CRN123' }))
    })
  })

  describe('saveSelectAddress', () => {
    beforeEach(() => {
      setSessionData({
        nameOrNumber,
        postcode,
        lookupResults,
      })
    })

    it('redirects to the lookup page if there are no lookup results in the session', async () => {
      setSessionData({
        ...fullSessionData,
        lookupResults: null,
      })

      await controller.saveSelectAddress()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.lookup({ crn: 'CRN123' }))
    })

    it('redirects to the select address page with an error if no address was selected', async () => {
      request.body = {}

      await controller.saveSelectAddress()(request, response, next)

      expect(validationUtils.validateAndFlashErrors).toHaveBeenCalledWith(request, {
        addressUprn: 'Select an address',
      })
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.selectAddress({ crn: 'CRN123' }))
    })

    it('redirects to the select address page with an error if an address not in the list was selected', async () => {
      request.body = { addressUprn: '1234567890' }

      await controller.saveSelectAddress()(request, response, next)

      expect(validationUtils.validateAndFlashErrors).toHaveBeenCalledWith(request, {
        addressUprn: 'Select an address',
      })
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.selectAddress({ crn: 'CRN123' }))
    })

    it('saves the selected address to the session and redirects to the details page', async () => {
      request.body = { addressUprn: lookupResults[0].uprn }

      await controller.saveSelectAddress()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.type({ crn: 'CRN123' }))
      expect(controller.formData.update).toHaveBeenCalledWith('CRN123', request.session, {
        address: lookupResults[0],
      })
    })
  })

  describe('details', () => {
    it('renders details page', async () => {
      setSessionData({})

      await controller.details()(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.ADD_PROPOSED_ADDRESS_DETAILS, {
        who: user.username,
        correlationId: 'request-id',
      })
      expect(response.render).toHaveBeenCalledWith('pages/proposed-address/details', {
        crn: 'CRN123',
        backLinkHref: uiPaths.proposedAddresses.lookup({ crn: 'CRN123' }),
        address: {},
        errors: {},
        errorSummary: [],
      })
    })

    it('renders details page with session data', async () => {
      setSessionData({
        address,
      })

      await controller.details()(request, response, next)

      expect(response.render).toHaveBeenCalledWith('pages/proposed-address/details', {
        crn: 'CRN123',
        backLinkHref: uiPaths.proposedAddresses.lookup({ crn: 'CRN123' }),
        address,
        errors: {},
        errorSummary: [],
      })
    })

    it('redirects to the Case details page if there is no session data', async () => {
      await controller.details()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(uiPaths.cases.show({ crn: 'CRN123' }))
    })
  })

  describe('saveDetails', () => {
    beforeEach(() => {
      setSessionData({})
    })

    it('redirects to type when the submitted address is valid', async () => {
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
      request.body = {
        addressLine1: '',
        addressLine2: '',
        addressTown: '',
        addressCounty: '',
        addressPostcode: '',
        addressCountry: 'UK',
      }
      await controller.saveDetails()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.details({ crn: 'CRN123' }))
    })
  })

  describe('type', () => {
    it('renders arrangement type page', async () => {
      setSessionData({
        lookupResults,
        address,
      })

      await controller.type()(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.ADD_PROPOSED_ADDRESS_TYPE, {
        who: user.username,
        correlationId: 'request-id',
      })
      expect(response.render).toHaveBeenCalledWith('pages/proposed-address/type', {
        crn: 'CRN123',
        backLinkHref: uiPaths.proposedAddresses.selectAddress({ crn: 'CRN123' }),
        name: 'James Smith',
        errors: {},
        errorSummary: [],
        accommodationTypeItems: accommodationTypeItems(accommodationTypes),
      })
    })

    it('renders arrangement type page with session data', async () => {
      setSessionData({
        lookupResults,
        address,
        accommodationTypeCode,
      })
      await controller.type()(request, response, next)

      expect(response.render).toHaveBeenCalledWith('pages/proposed-address/type', {
        crn: 'CRN123',
        backLinkHref: uiPaths.proposedAddresses.selectAddress({ crn: 'CRN123' }),
        name: 'James Smith',
        errors: {},
        errorSummary: [],
        accommodationTypeItems: accommodationTypeItems(accommodationTypes, accommodationTypeCode),
      })
    })

    it('renders a back link to address details if there are no lookup results in the session', async () => {
      setSessionData({
        address,
      })

      await controller.type()(request, response, next)

      expect(response.render).toHaveBeenCalledWith(
        'pages/proposed-address/type',
        expect.objectContaining({
          backLinkHref: uiPaths.proposedAddresses.details({ crn: 'CRN123' }),
        }),
      )
    })

    it('redirects when the session data is invalid', async () => {
      jest.spyOn(proposedAddressesUtils, 'validateUpToAddress').mockReturnValue('/redirect-url')

      await controller.type()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith('/redirect-url')
      expect(auditService.logPageView).toHaveBeenCalled()
    })
  })

  describe('saveType', () => {
    beforeEach(() => {
      setSessionData({
        address,
      })
    })

    it('redirects to status when arrangement type valid', async () => {
      request.body = {
        accommodationTypeCode,
      }

      await controller.saveType()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.status({ crn: 'CRN123' }))
    })

    it('redirects to arrangement type when arrangement type invalid', async () => {
      request.body = {
        arrangementSubType: undefined,
        settledType: undefined,
      }

      await controller.saveType()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.type({ crn: 'CRN123' }))
    })
  })

  describe('status', () => {
    it('renders status page', async () => {
      setSessionData({
        address,
        accommodationTypeCode,
      })
      jest.spyOn(backlinks, 'getPageBackLink').mockReturnValue(uiPaths.proposedAddresses.type({ crn: 'CRN123' }))

      await controller.status()(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.ADD_PROPOSED_ADDRESS_STATUS, {
        who: user.username,
        correlationId: 'request-id',
      })
      expect(response.render).toHaveBeenCalledWith('pages/proposed-address/status', {
        crn: 'CRN123',
        backLinkHref: '/cases/CRN123/proposed-addresses/type',
        errors: {},
        errorSummary: [],
        verificationStatusItems: verificationStatusItems(),
      })
    })

    it('renders status page with session data', async () => {
      setSessionData({
        address,
        accommodationTypeCode,
        verificationStatus: 'NOT_CHECKED_YET',
      })
      jest.spyOn(backlinks, 'getPageBackLink').mockReturnValue(uiPaths.proposedAddresses.type({ crn: 'CRN123' }))
      await controller.status()(request, response, next)

      expect(response.render).toHaveBeenCalledWith('pages/proposed-address/status', {
        crn: 'CRN123',
        backLinkHref: '/cases/CRN123/proposed-addresses/type',
        errors: {},
        errorSummary: [],
        verificationStatusItems: verificationStatusItems('NOT_CHECKED_YET'),
      })
    })

    it('redirects when the session data is invalid', async () => {
      jest.spyOn(proposedAddressesUtils, 'validateUpToType').mockReturnValue('/redirect-url')

      await controller.status()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith('/redirect-url')
      expect(auditService.logPageView).toHaveBeenCalled()
    })
  })

  describe('saveStatus', () => {
    beforeEach(() => {
      setSessionData(fullSessionData)
    })

    it('redirects to check your answers when status valid and status is not PASSED', async () => {
      request.body = { verificationStatus: 'NOT_CHECKED_YET' }

      await controller.saveStatus()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.checkYourAnswers({ crn: 'CRN123' }))
    })

    it('redirects to next accommodation when status is PASSED', async () => {
      request.body = { verificationStatus: 'PASSED' }

      await controller.saveStatus()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.nextAccommodation({ crn: 'CRN123' }))
    })

    it('redirects to status when status invalid', async () => {
      request.body = { verificationStatus: undefined }

      await controller.saveStatus()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.status({ crn: 'CRN123' }))
    })
  })

  describe('nextAccommodation', () => {
    it('renders next accommodation page', async () => {
      setSessionData({
        address,
        accommodationTypeCode,
        verificationStatus: 'PASSED',
      })
      jest.spyOn(backlinks, 'getPageBackLink').mockReturnValue(uiPaths.proposedAddresses.status({ crn: 'CRN123' }))

      await controller.nextAccommodation()(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.ADD_PROPOSED_ADDRESS_NEXT_ACCOMMODATION, {
        who: user.username,
        correlationId: 'request-id',
      })
      expect(response.render).toHaveBeenCalledWith('pages/proposed-address/next-accommodation', {
        crn: 'CRN123',
        nextAccommodationStatusItems: nextAccommodationStatusItems(),
        name: 'James Smith',
        backLinkHref: '/cases/CRN123/proposed-addresses/status',
        errors: {},
        errorSummary: [],
      })
    })

    it('renders next accommodation page with session data', async () => {
      setSessionData({
        address,
        accommodationTypeCode,
        verificationStatus: 'PASSED',
        nextAccommodationStatus: 'NO',
      })

      jest.spyOn(backlinks, 'getPageBackLink').mockReturnValue(uiPaths.proposedAddresses.status({ crn: 'CRN123' }))

      await controller.nextAccommodation()(request, response, next)

      expect(response.render).toHaveBeenCalledWith('pages/proposed-address/next-accommodation', {
        crn: 'CRN123',
        name: 'James Smith',
        nextAccommodationStatusItems: nextAccommodationStatusItems('NO'),
        backLinkHref: '/cases/CRN123/proposed-addresses/status',
        errors: {},
        errorSummary: [],
      })
    })

    it('redirects when the session data is invalid', async () => {
      jest.spyOn(proposedAddressesUtils, 'validateUpToStatus').mockReturnValue('/redirect-url')

      await controller.nextAccommodation()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith('/redirect-url')
      expect(auditService.logPageView).toHaveBeenCalled()
    })
  })

  describe('saveNextAccommodation', () => {
    beforeEach(() => {
      setSessionData(fullSessionData)
    })

    it('redirects to check your answers when next accommodation valid', async () => {
      request.body = { nextAccommodationStatus: 'YES' }

      await controller.saveNextAccommodation()(request, response, next)
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.checkYourAnswers({ crn: 'CRN123' }))
    })

    it('redirects to next accommodation when next accommodation invalid', async () => {
      request.body = { nextAccommodationStatus: undefined }

      await controller.saveNextAccommodation()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.nextAccommodation({ crn: 'CRN123' }))
    })
  })

  describe('checkYourAnswers', () => {
    it('renders check your answers', async () => {
      setSessionData(fullSessionData)

      jest
        .spyOn(backlinks, 'getPageBackLink')
        .mockReturnValue(uiPaths.proposedAddresses.nextAccommodation({ crn: 'CRN123' }))

      await controller.checkYourAnswers()(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.ADD_PROPOSED_ADDRESS_CHECK_YOUR_ANSWERS, {
        who: user.username,
        correlationId: 'request-id',
      })
      expect(response.render).toHaveBeenCalledWith('pages/proposed-address/check-your-answers', {
        crn: 'CRN123',
        tableRows: checkYourAnswersRows(fullSessionData, 'CRN123', 'James Smith', accommodationTypes),
        backLinkHref: uiPaths.proposedAddresses.nextAccommodation({ crn: 'CRN123' }),
        errors: {},
        errorSummary: [],
      })
    })

    it('redirects when the session data is invalid', async () => {
      jest.spyOn(proposedAddressesUtils, 'validateUpToNextAccommodation').mockReturnValue('/redirect-url')

      await controller.checkYourAnswers()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith('/redirect-url')
      expect(auditService.logPageView).toHaveBeenCalled()
    })
  })

  describe('submit', () => {
    it('submits, clears session data and redirects', async () => {
      setSessionData(fullSessionData)

      await controller.submit()(request, response, next)

      expect(proposedAddressesService.submit).toHaveBeenCalledWith('token-1', 'CRN123', fullSessionData)
      expect(controller.formData.remove).toHaveBeenCalledWith('CRN123', request.session)
      expect(request.flash).toHaveBeenCalledWith('success', 'Private address added')
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.cases.show({ crn: 'CRN123' }))
    })

    it('redirects when the session data is invalid', async () => {
      jest.spyOn(proposedAddressesUtils, 'validateUpToNextAccommodation').mockReturnValue('/redirect-url')

      await controller.submit()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith('/redirect-url')
    })

    it('redirects when api call fails', async () => {
      setSessionData(fullSessionData)
      jest.spyOn(proposedAddressesService, 'submit').mockRejectedValue(new Error('API error'))

      await controller.submit()(request, response, next)

      expect(proposedAddressesService.submit).toHaveBeenCalledWith('token-1', 'CRN123', fullSessionData)
      expect(controller.formData.remove).not.toHaveBeenCalled()
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.checkYourAnswers({ crn: 'CRN123' }))
      expect(auditService.logPageView).not.toHaveBeenCalled()
    })
  })

  describe('edit', () => {
    it.each([
      { page: 'lookup', redirect: uiPaths.proposedAddresses.lookup },
      { page: 'details', redirect: uiPaths.proposedAddresses.details },
      { page: 'type', redirect: uiPaths.proposedAddresses.type },
      { page: 'status', redirect: uiPaths.proposedAddresses.status },
      { page: 'nextAccommodation', redirect: uiPaths.proposedAddresses.nextAccommodation },
    ])('redirects to the $page form and sets the referrer as a redirect', async ({ page, redirect }) => {
      request.headers.referer = '/referrer'
      request.params.page = page
      request.params.id = 'address-id'
      const proposedAddress = proposedAccommodationFactory.build({ crn: 'CRN123', id: 'address-id' })
      proposedAddressesService.getProposedAddress.mockResolvedValue(apiResponseFactory.proposedAddress(proposedAddress))

      jest.spyOn(controller.formData, 'update')

      await controller.edit()(request, response, next)

      const { accommodationType, ...proposedAddressWithoutAccommodationType } = proposedAddress

      expect(controller.formData.remove).toHaveBeenCalled()
      expect(proposedAddressesService.getProposedAddress).toHaveBeenCalledWith('token-1', 'CRN123', 'address-id')
      expect(controller.formData.update).toHaveBeenCalledWith(
        'CRN123',
        request.session,
        expect.objectContaining({
          redirect: '/referrer',
          ...proposedAddressWithoutAccommodationType,
          accommodationTypeCode: accommodationType.code,
        }),
      )
      expect(response.redirect).toHaveBeenCalledWith(redirect({ crn: 'CRN123' }))
    })
  })

  describe('cancel', () => {
    it('clears session data and redirects to the case details page', async () => {
      setSessionData(fullSessionData)

      await controller.cancel()(request, response, next)

      expect(controller.formData.remove).toHaveBeenCalledWith('CRN123', request.session)
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.cases.show({ crn: 'CRN123' }))
    })

    describe('if the Check your answer page has been reached', () => {
      it('clears session data and redirects to the case details page', async () => {
        setSessionData({ ...fullSessionData, redirect: uiPaths.proposedAddresses.checkYourAnswers({ crn: 'CRN123' }) })

        await controller.cancel()(request, response, next)

        expect(controller.formData.remove).toHaveBeenCalledWith('CRN123', request.session)
        expect(response.redirect).toHaveBeenCalledWith(uiPaths.cases.show({ crn: 'CRN123' }))
      })
    })
  })

  describe('when editing a new address from the Check your answers page', () => {
    const checkYourAnswersUrl = uiPaths.proposedAddresses.checkYourAnswers({ crn: 'CRN123' })

    beforeEach(() => {
      setSessionData({
        ...fullSessionData,
        redirect: checkYourAnswersUrl,
      })
    })

    describe('saveLookup', () => {
      it('saves the address in session and redirects to Check your Answers if there is only one address result', async () => {
        osDataHubService.getByNameOrNumberAndPostcode.mockResolvedValue([lookupResults[1]])
        request.body = { nameOrNumber: '23A', postcode: 'M21 0BP' }

        await controller.saveLookup()(request, response, next)

        expect(response.redirect).toHaveBeenCalledWith(checkYourAnswersUrl)
        expect(controller.formData.update).toHaveBeenCalledTimes(2)
        expect(controller.formData.update).toHaveBeenLastCalledWith('CRN123', request.session, {
          lookupResults: [lookupResults[1]],
          address: lookupResults[1],
        })
      })
    })

    it.each([
      { handler: 'saveSelectAddress', body: { addressUprn: lookupResults[1].uprn } },
      {
        handler: 'saveDetails',
        body: { addressLine1: 'Foo', addressTown: 'Town', addressPostcode: 'T4', addressCountry: 'Wales' },
      },
      { handler: 'saveType', body: { accommodationTypeCode: 'A44' } },
      { handler: 'saveStatus', body: { verificationStatus: 'NOT_CHECKED_YET' } },
      { handler: 'saveNextAccommodation', body: { nextAccommodationStatus: 'YES' } },
    ])('saves the $handler data in session and redirects to the Check your answers page', async ({ handler, body }) => {
      request.body = body

      // @ts-expect-error dynamic method typing
      await controller[handler]()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(checkYourAnswersUrl)
      expect(controller.formData.update).toHaveBeenCalledWith('CRN123', request.session, expect.any(Object))
    })

    describe('saveStatus', () => {
      it('redirects to the Next accommodation page when status is PASSED', async () => {
        request.body = { verificationStatus: 'PASSED' }

        await controller.saveStatus()(request, response, next)

        expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.nextAccommodation({ crn: 'CRN123' }))
      })
    })
  })

  describe('when editing an existing address', () => {
    const id = 'address-id'
    const redirect = uiPaths.proposedAddresses.show({ crn: 'CRN123', id })

    beforeEach(() => {
      setSessionData({
        ...fullSessionData,
        id,
        redirect,
      })
    })

    describe('saveLookup', () => {
      it('saves the address in session and redirects to the original page if there is only one address result', async () => {
        osDataHubService.getByNameOrNumberAndPostcode.mockResolvedValue([lookupResults[1]])
        request.body = { nameOrNumber: '23A', postcode: 'M21 0BP' }

        await controller.saveLookup()(request, response, next)

        expect(response.redirect).toHaveBeenCalledWith(redirect)
        expect(proposedAddressesService.update).toHaveBeenCalledWith(
          'token-1',
          'CRN123',
          expect.objectContaining({ id: 'address-id' }),
        )
        expect(controller.formData.remove).toHaveBeenCalledWith('CRN123', request.session)
      })
    })

    it.each([
      { handler: 'saveSelectAddress', body: { addressUprn: lookupResults[1].uprn } },
      {
        handler: 'saveDetails',
        body: { addressLine1: 'Foo', addressTown: 'Town', addressPostcode: 'T4', addressCountry: 'Wales' },
      },
      { handler: 'saveType', body: { accommodationTypeCode: 'A44' } },
      { handler: 'saveStatus', body: { verificationStatus: 'NOT_CHECKED_YET' } },
      { handler: 'saveNextAccommodation', body: { nextAccommodationStatus: 'YES' } },
    ])('saves the $handler data in session and redirects to the address details page', async ({ handler, body }) => {
      request.body = body

      // @ts-expect-error dynamic method typing
      await controller[handler]()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(redirect)
      expect(proposedAddressesService.update).toHaveBeenCalledWith(
        'token-1',
        'CRN123',
        expect.objectContaining({ id: 'address-id' }),
      )
      expect(controller.formData.remove).toHaveBeenCalledWith('CRN123', request.session)
    })

    describe('saveStatus', () => {
      it('redirects to the Next accommodation page when status is PASSED', async () => {
        request.body = { verificationStatus: 'PASSED' }

        await controller.saveStatus()(request, response, next)

        expect(response.redirect).toHaveBeenCalledWith(uiPaths.proposedAddresses.nextAccommodation({ crn: 'CRN123' }))
      })
    })

    describe('cancel', () => {
      it('clears session data and redirects to the proposed address page', async () => {
        await controller.cancel()(request, response, next)

        expect(response.redirect).toHaveBeenCalledWith(redirect)
        expect(controller.formData.remove).toHaveBeenCalledWith('CRN123', request.session)
      })
    })
  })
})
