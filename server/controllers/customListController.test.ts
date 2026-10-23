import { NextFunction, Request, Response } from 'express'
import { mock } from 'jest-mock-extended'
import { SanitisedError } from '@ministryofjustice/hmpps-rest-client'
import AuditService, { Page } from '../services/auditService'
import { user } from '../routes/testutils/appSetup'
import { apiResponseFactory, caseFactory } from '../testutils/factories'
import { casesResultsSummary, casesTableColumns, casesTabs, casesToRows } from '../utils/cases'
import UserService from '../services/userService'
import CustomListController from './customListController'
import CustomListService from '../services/customListService'
import * as validationUtils from '../utils/validation'
import uiPaths from '../paths/ui'
import { listOfCrns } from '../testutils/crn'

describe('customListController', () => {
  const TEST_TOKEN = 'test-token'

  let request: Request
  const response = mock<Response>({
    locals: { user: { token: TEST_TOKEN, username: 'user1', userId: 'user-id-1', displayName: 'Jane Doe' } },
  })
  const next = mock<NextFunction>()

  const auditService = mock<AuditService>()
  const customListService = mock<CustomListService>()
  const userService = mock<UserService>()

  const customListController = new CustomListController(auditService, customListService, userService)

  beforeEach(() => {
    jest.clearAllMocks()
    request = mock<Request>({ id: 'request-id', originalUrl: '/' })
  })

  describe('index', () => {
    const teams = [{ code: 'team-code', name: 'Team Name' }]
    const baseContext = {
      assignedToOptions: [
        { value: '', text: 'You (J. Doe)' },
        { value: 'team-code', text: 'Team Name' },
      ],
      riskLevelOptions: [
        { value: '', text: 'All' },
        { value: 'VERY_HIGH', text: 'Very high' },
        { value: 'HIGH', text: 'High' },
        { value: 'MEDIUM', text: 'Medium' },
        { value: 'LOW', text: 'Low' },
      ],
    }

    beforeEach(() => {
      userService.getTeams.mockResolvedValue(apiResponseFactory.buildResponse(teams))
    })

    it('renders the create custom list page when no list already exits', async () => {
      customListService.getCustomList.mockResolvedValue(apiResponseFactory.caseList([]))
      await customListController.index()(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.CUSTOM_LIST_INDEX, {
        who: user.username,
        correlationId: 'request-id',
      })
      expect(response.render).toHaveBeenCalledWith('pages/customList/index', {
        addCrnsHref: '/custom-list/add-crns',
      })
    })

    it('renders the custom list page when a list already exists', async () => {
      const cases = caseFactory.buildList(3)
      customListService.getCustomList.mockResolvedValue(apiResponseFactory.caseList(cases))
      request.query = {}
      await customListController.index()(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.CUSTOM_LIST_SHOW, {
        who: user.username,
        correlationId: 'request-id',
      })
      expect(userService.getTeams).toHaveBeenCalledWith(TEST_TOKEN)
      // TODO once backend filter has been setup
      // expect(customListService.getCustomList).toHaveBeenCalledWith(TEST_TOKEN, { peopleType: 'NFA_RISK' })
      expect(customListService.getCustomList).toHaveBeenCalledWith(TEST_TOKEN)
      expect(response.render).toHaveBeenCalledWith('pages/customList/show', {
        changeListHref: '/custom-list/add-crns',
        ...baseContext,
        tabs: casesTabs(request.originalUrl, 'NFA_RISK'),
        peopleType: 'NFA_RISK',
        resultsSummary: casesResultsSummary(cases),
        casesTableColumns: casesTableColumns(),
        casesRows: casesToRows(cases),
        filters: [],
        query: {},
      })
    })

    it('stores the current custom list in flash when a list already exists', async () => {
      const cases = [caseFactory.build({ crn: 'CRN1' }), caseFactory.build({ crn: 'CRN2' })]
      customListService.getCustomList.mockResolvedValue(apiResponseFactory.caseList(cases))
      const addUserInputToFlash = jest.spyOn(validationUtils, 'addUserInputToFlash')

      await customListController.index()(request, response, next)

      expect(request.body).toEqual({ crnList: 'CRN1,CRN2' })
      expect(addUserInputToFlash).toHaveBeenCalledWith(request)
    })
  })
  describe('addCrns', () => {
    it.each([null, 'CRN1,CRN2'])('renders the add crns page when list is: %s', async crnList => {
      const caseList = crnList ? [caseFactory.build({ crn: 'CRN1' }), caseFactory.build({ crn: 'CRN2' })] : []
      const expectedCrnList = crnList || ''
      customListService.getCustomList.mockResolvedValue(apiResponseFactory.caseList(caseList))
      const expectedError = new Error('Error Message')
      const expectedErrorSummary = ['Error Summary']
      jest
        .spyOn(validationUtils, 'fetchErrorsAndUserInput')
        .mockReturnValue({ errors: expectedError, errorSummary: expectedErrorSummary, userInput: null })
      await customListController.addCrns()(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.CUSTOM_LIST_ADD_CRNS, {
        who: user.username,
        correlationId: 'request-id',
      })
      expect(response.render).toHaveBeenCalledWith('pages/customList/addCrns', {
        crnList: expectedCrnList,
        backLinkHref: uiPaths.customList.index.pattern,
        errorSummary: expectedErrorSummary,
        errors: expectedError,
      })
    })

    it('prefers flashed user input over the stored custom list', async () => {
      customListService.getCustomList.mockResolvedValue(
        apiResponseFactory.caseList([caseFactory.build({ crn: 'CRN1' }), caseFactory.build({ crn: 'CRN2' })]),
      )
      jest.spyOn(validationUtils, 'fetchErrorsAndUserInput').mockReturnValue({
        errors: null,
        errorSummary: [],
        userInput: { crnList: 'CRN3\nCRN4' },
      })

      await customListController.addCrns()(request, response, next)

      expect(response.render).toHaveBeenCalledWith('pages/customList/addCrns', {
        crnList: 'CRN3\nCRN4',
        backLinkHref: uiPaths.customList.index.pattern,
        errorSummary: [],
        errors: null,
      })
    })
  })
  describe('submitCrnList', () => {
    it.each([
      ['A123456,B123456', 2],
      ['C123456', 1],
    ])('renders the confirmation page on successful submission: %s', async (crnList, crnTotal) => {
      request.body = { crnList }
      await customListController.submitCrnList()(request, response, next)

      expect(customListService.addCustomList).toHaveBeenCalledWith(TEST_TOKEN, crnList.split(','))
      expect(request.body).toEqual({ crnList })
      expect(response.redirect).toHaveBeenCalledWith(`${uiPaths.customList.confirmation.pattern}?t=${crnTotal}`)
    })

    it('normalises CRNs separated by spaces, commas and line breaks', async () => {
      request.body = { crnList: 'A123456,\nB123456  C123456\n\nD123456' }

      await customListController.submitCrnList()(request, response, next)

      expect(customListService.addCustomList).toHaveBeenCalledWith(TEST_TOKEN, [
        'A123456',
        'B123456',
        'C123456',
        'D123456',
      ])
      expect(response.redirect).toHaveBeenCalledWith(`${uiPaths.customList.confirmation.pattern}?t=4`)
    })

    it('Errors when an empty list is submitted', async () => {
      request.body = { crnList: '' }
      const errorResponse = jest.spyOn(validationUtils, 'addErrorToFlash')

      await customListController.submitCrnList()(request, response, next)

      expect(request.body).toEqual({ crnList: '' })
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.customList.addCrns.pattern)
      expect(errorResponse).toHaveBeenCalledWith(request, 'crnList', 'Enter 500 CRNs or fewer')
    })
    it('Errors when too many CRNs are submitted', async () => {
      const crnList = listOfCrns(501)
      request.body = { crnList }
      const errorResponse = jest.spyOn(validationUtils, 'addErrorToFlash')

      await customListController.submitCrnList()(request, response, next)

      expect(request.body).toEqual({ crnList })
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.customList.addCrns.pattern)
      expect(errorResponse).toHaveBeenCalledWith(request, 'crnList', 'Enter 500 CRNs or fewer')
    })

    it('renders the addCrns page with errors on unsuccessful submission', async () => {
      const serverError: SanitisedError = new Error('Server error')
      // serverError.data = { errorCode: 'invalidCrns', userMessage: 'A123456, B123456' }
      customListService.addCustomList.mockRejectedValue(serverError)
      const crnList = 'A123456,B123456'
      request.body = { crnList }

      const errorResponse = jest.spyOn(validationUtils, 'addErrorToFlash')
      await customListController.submitCrnList()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(uiPaths.customList.addCrns.pattern)
      expect(errorResponse).toHaveBeenCalledWith(request, 'crnList', 'Server error')
    })
  })
  describe('formatErrorMessage', () => {
    it('formats two invalid CRNs without a comma before the final item', () => {
      const error = {
        responseStatus: 400,
        data: { userMessage: 'A123456, B123456', errorCode: 'invalidCrns' },
      }

      expect(customListController.formatErrorMessage(error)).toBe('A123456 and B123456 are not recognised CRNs')
    })
    it('handles 0 crns', () => {
      const error = {
        responseStatus: 400,
        message: 'BAD REQUEST',
        data: { errorCode: 'invalidCrns' },
      }

      expect(customListController.formatErrorMessage(error)).toBe('BAD REQUEST')
    })

    it('formats three invalid CRNs with commas between earlier items and "and" before the final item', () => {
      const error = {
        responseStatus: 400,
        data: { userMessage: 'A123456,B123456,C123456', errorCode: 'invalidCrns' },
      }

      expect(customListController.formatErrorMessage(error)).toBe(
        'A123456, B123456 and C123456 are not recognised CRNs',
      )
    })

    it('formats a single invalid CRN without a list separator', () => {
      const error = {
        responseStatus: 400,
        data: { userMessage: 'A123456', errorCode: 'invalidCrns' },
      }

      expect(customListController.formatErrorMessage(error)).toBe('A123456 is not a recognised CRN')
    })

    it('falls back to the raw message when no CRN list can be extracted', () => {
      const error = {
        responseStatus: 400,
        message: 'CRN validation failed',
      }

      expect(customListController.formatErrorMessage(error)).toBe('CRN validation failed')
    })
  })

  describe('confirmation', () => {
    it.each([
      [1, 'CRN added'],
      [2, 'CRNs added'],
    ])('renders the confirmation page with correct wording for %i CRN(s)', async (crnTotalText, crnAddedText) => {
      request.query = { t: crnTotalText.toString() }
      await customListController.confirmation()(request, response, next)

      expect(response.render).toHaveBeenCalledWith('pages/customList/confirmation', {
        crnTotalText,
        crnAddedText,
        showHref: uiPaths.customList.index.pattern,
      })
    })
  })
})
