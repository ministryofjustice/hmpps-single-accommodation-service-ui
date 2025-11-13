import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from './testutils/appSetup'
import AuditService, { Page } from '../services/auditService'
import CasesService from '../services/casesService'
import { CaseSummary } from '../data/casesClient'
import logger from '../../logger'

jest.mock('../services/auditService')
jest.mock('../services/casesService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const casesService = new CasesService(null) as jest.Mocked<CasesService>

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
      casesService,
    },
    userSupplier: () => user,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /', () => {
  it('should render index page', () => {
    const cases: Array<CaseSummary> = [
      {
        name: 'John Smith',
      },
    ]
    auditService.logPageView.mockResolvedValue(null)
    casesService.getCases.mockResolvedValue(cases)

    return request(app)
      .get('/')
      .expect('Content-Type', /html/)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Cases')
        expect(res.text).toContain('John Smith')
        expect(auditService.logPageView).toHaveBeenCalledWith(Page.CASES, {
          who: user.username,
          correlationId: expect.any(String),
        })
        expect(casesService.getCases).toHaveBeenCalled()
      })
  })

  it('service errors are handled', () => {
    jest.spyOn(logger, 'error').mockImplementation()
    auditService.logPageView.mockResolvedValue(null)
    casesService.getCases.mockRejectedValue(new Error('Some problem calling external api!'))

    return request(app)
      .get('/')
      .expect('Content-Type', /html/)
      .expect(500)
      .expect(res => {
        expect(res.text).toContain('Some problem calling external api!')
      })
  })
})
