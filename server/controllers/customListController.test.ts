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
    it('renders the show custom list page', async () => {
      await customListController.customList()(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.CUSTOM_LIST_INDEX, {
        who: user.username,
        correlationId: 'request-id',
      })
      expect(response.render).toHaveBeenCalledWith('pages/customList/index', {
        addCrnsHref: '/custom-list/add-crns',
      })
    })
  })
  describe('addCrns', () => {
    it.each([null, 'CRN1,CRN2'])('renders the add crns page when list is: %s', async crnList => {
      jest
        .spyOn(validationUtils, 'fetchErrorsAndUserInput')
        .mockReturnValue({ errors: {}, errorSummary: [], userInput: { crnList } })

      await customListController.addCrns()(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.CUSTOM_LIST_ADD_CRNS, {
        who: user.username,
        correlationId: 'request-id',
      })
      expect(response.render).toHaveBeenCalledWith('pages/customList/addCrns', {
        crnList,
        errorSummary: [],
        errors: {},
      })
    })
  })
  describe('show', () => {
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

    it('renders the show custom list page', async () => {
      const cases = caseFactory.buildList(3)
      customListService.getCustomList.mockResolvedValue(apiResponseFactory.caseList(cases))
      request.query = {}
      await customListController.show()(request, response, next)

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
  })
  describe('submitCrnList', () => {
    it('renders the confirmation page on successful submission', async () => {
      const crnList = 'CRN1,CRN2'
      request.body = { crnList }
      await customListController.submitCrnList()(request, response, next)

      expect(response.render).toHaveBeenCalledWith('pages/customList/confirmation', {
        crns: 2,
        showHref: uiPaths.customList.show.pattern,
      })
    })
    it('renders the addCrns page with errors on unsuccessful submission', async () => {
      const serverError: SanitisedError = new Error('Server error')
      serverError.responseStatus = 500
      serverError.data = { developerMessage: 'Dev error', userMessage: 'Server error' }
      customListService.addCustomList.mockRejectedValue(serverError)
      const crnList = 'CRN1,CRN2'
      request.body = { crnList }
      jest
        .spyOn(validationUtils, 'fetchErrorsAndUserInput')
        .mockReturnValue({ errors: serverError, errorSummary: [''], userInput: { crnList } })

      await customListController.submitCrnList()(request, response, next)

      expect(response.render).toHaveBeenCalledWith('pages/customList/addCrns', {
        crnList,
        error: 'Server error',
        errors: serverError,
        errorSummary: [''],
      })
    })
  })
})
