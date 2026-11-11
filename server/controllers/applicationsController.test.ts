import { NextFunction, Request, Response } from 'express'
import { mock } from 'jest-mock-extended'
import ApplicationsController from './applicationsController'
import AuditService, { Page } from '../services/auditService'
import CasesService from '../services/casesService'
import config from '../config'
import { apiResponseFactory, caseFactory } from '../testutils/factories'
import * as validation from '../utils/validation'

describe('ApplicationsController', () => {
  const auditService = mock<AuditService>()
  const casesService = mock<CasesService>()
  const controller = new ApplicationsController(auditService, casesService)
  const request = mock<Request>({
    id: 'request-id',
    params: { crn: 'X123456', applicationId: 'application-123' },
    flash: jest.fn(),
  })
  const response = mock<Response>({ locals: { user: { username: 'user1', token: 'token-1' } } })
  const next = mock<NextFunction>()
  const originalFlag = config.flags.cas2ManualArrivalEnabled

  beforeEach(() => {
    jest.clearAllMocks()
    config.flags.cas2ManualArrivalEnabled = true
    casesService.getCase.mockResolvedValue(
      apiResponseFactory.case(caseFactory.build({ forename: 'Rhys', middleNames: '', surname: 'Davies' })),
    )
    jest.spyOn(validation, 'fetchErrorsAndUserInput').mockReturnValue({ errors: {}, errorSummary: [], userInput: {} })
    jest.spyOn(validation, 'addGenericErrorToFlash').mockImplementation(() => undefined)
  })

  afterEach(() => {
    config.flags.cas2ManualArrivalEnabled = originalFlag
    jest.restoreAllMocks()
    jest.useRealTimers()
  })

  it('renders the CAS2 arrival confirmation with the case name and profile links', async () => {
    await controller.arrival()(request, response, next)

    expect(casesService.getCase).toHaveBeenCalledWith('token-1', 'X123456')
    expect(response.render).toHaveBeenCalledWith('pages/applications/cas2/arrival', {
      displayName: 'Rhys Davies',
      formAction: '/cases/X123456/applications/application-123/arrival',
      backLinkHref: '/cases/X123456',
      cancelLinkHref: '/cases/X123456',
      errorSummary: [],
    })
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CAS2_ARRIVAL, {
      who: 'user1',
      correlationId: 'request-id',
    })
  })

  it.each(['arrival', 'saveArrival'] as const)('blocks %s when manual arrival is disabled', async handler => {
    config.flags.cas2ManualArrivalEnabled = false
    await controller[handler]()(request, response, next)
    expect(response.sendStatus).toHaveBeenCalledWith(404)
    expect(casesService.getCase).not.toHaveBeenCalled()
    expect(casesService.submitCas2Arrival).not.toHaveBeenCalled()
  })

  it('submits the arrival timestamp and returns to the profile', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-30T12:00:00.000Z'))
    await controller.saveArrival()(request, response, next)
    expect(casesService.submitCas2Arrival).toHaveBeenCalledWith('token-1', 'X123456', 'application-123', {
      markedAsArrivedDateTime: '2026-10-30T12:00:00.000Z',
    })
    expect(request.flash).toHaveBeenCalledWith('success', 'CAS2 accommodation marked as arrived')
    expect(response.redirect).toHaveBeenCalledWith('/cases/X123456')
  })

  it('redisplays the confirmation with an error when submission fails', async () => {
    casesService.submitCas2Arrival.mockRejectedValueOnce(new Error('API unavailable'))
    await controller.saveArrival()(request, response, next)
    expect(validation.addGenericErrorToFlash).toHaveBeenCalledWith(
      request,
      'There was a problem confirming the arrival. Please try again.',
    )
    expect(response.redirect).toHaveBeenCalledWith('/cases/X123456/applications/application-123/arrival')
  })
})
