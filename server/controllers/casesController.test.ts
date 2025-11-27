import { NextFunction, Request, Response } from 'express'
import { mock } from 'jest-mock-extended'
import CasesController from './casesController'
import AuditService, { Page } from '../services/auditService'
import CasesService from '../services/casesService'
import { user } from '../routes/testutils/appSetup'

describe('casesController', () => {
  const request = mock<Request>({ id: 'request-id' })
  const response = mock<Response>({ locals: { user: { username: 'user1' } } })
  const next = mock<NextFunction>()

  const auditService = mock<AuditService>()
  const casesService = mock<CasesService>()

  let casesController: CasesController

  beforeEach(() => {
    casesController = new CasesController(auditService, casesService)
  })

  describe('index', () => {
    it('renders the case list page', async () => {
      casesService.getCases.mockResolvedValue({ cases: [] })
      await casesController.index()(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.CASES_LIST, {
        who: user.username,
        correlationId: 'request-id',
      })
      expect(casesService.getCases).toHaveBeenCalled()
      expect(response.render).toHaveBeenCalledWith('pages/index', expect.anything())
    })
  })
})
