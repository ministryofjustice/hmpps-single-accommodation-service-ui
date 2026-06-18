import request from 'supertest'
import { mock } from 'jest-mock-extended'
import { SanitisedError } from '@ministryofjustice/hmpps-rest-client'
import { NotFound } from 'http-errors'
import { appWithAllRoutes } from './routes/testutils/appSetup'
import logger from '../logger'
import AuditService from './services/auditService'

const auditService = mock<AuditService>()

jest.mock('../logger')

afterEach(() => {
  jest.resetAllMocks()
})

describe('UI 500', () => {
  it('should render error page with stack in dev mode', () => {
    return request(appWithAllRoutes({}))
      .get('/error')
      .expect(500)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Sorry, there is a problem with the service')
        expect(res.text).toContain('Try again later.')
        expect(res.text).toContain('500')
        expect(res.text).toContain('Server error')
        expect(res.text).toContain('STACKTRACE')
        expect(logger.error).toHaveBeenCalledWith(
          "Error handling request for '/error', user 'user1'",
          expect.any(Error),
        )
      })
  })

  it('should render error page without stack in production mode', () => {
    return request(appWithAllRoutes({ production: true }))
      .get('/error')
      .expect(500)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Sorry, there is a problem with the service')
        expect(res.text).toContain('Try again later.')
        expect(res.text).not.toContain('500')
        expect(res.text).not.toContain('Server error')
        expect(res.text).not.toContain('STACKTRACE')
        expect(logger.error).toHaveBeenCalledWith(
          "Error handling request for '/error', user 'user1'",
          expect.any(Error),
        )
      })
  })
})

describe('UI 404', () => {
  it('should render Not found page with stack in dev mode', () => {
    return request(appWithAllRoutes({}))
      .get('/unknown')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Page not found')
        expect(res.text).toContain('404')
        expect(res.text).toContain('NotFoundError: Not Found')
        expect(logger.error).toHaveBeenCalledWith(
          "Error handling request for '/unknown', user 'user1'",
          expect.any(Error),
        )
      })
  })

  it('should render Not found page without stack in production mode', () => {
    return request(appWithAllRoutes({ production: true }))
      .get('/unknown')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Page not found')
        expect(res.text).not.toContain('404')
        expect(res.text).not.toContain('NotFoundError: Not Found')
        expect(logger.error).toHaveBeenCalledWith(
          "Error handling request for '/unknown', user 'user1'",
          expect.any(Error),
        )
      })
  })
})

describe('API 500', () => {
  const apiError: SanitisedError = new Error('API error')
  apiError.responseStatus = 500
  apiError.data = { developerMessage: '[Something went wrong]' }

  beforeEach(() => {
    auditService.logPageView.mockRejectedValue(apiError)
  })

  it('should render error page with stack in dev mode', () => {
    return request(appWithAllRoutes({ services: { auditService } }))
      .get('/')
      .expect(500)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(auditService.logPageView).toHaveBeenCalled()
        expect(res.text).toContain('Sorry, there is a problem with the service')
        expect(res.text).toContain('Try again later.')
        expect(res.text).toContain('500')
        expect(res.text).toContain('[Something went wrong]')
        expect(res.text).toContain('Error: API error')
        expect(logger.error).toHaveBeenCalledWith("Error handling request for '/', user 'user1'", expect.any(Error))
      })
  })

  it('should render error page without stack in production mode', () => {
    return request(appWithAllRoutes({ production: true, services: { auditService } }))
      .get('/')
      .expect(500)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(auditService.logPageView).toHaveBeenCalled()
        expect(res.text).toContain('Sorry, there is a problem with the service')
        expect(res.text).toContain('Try again later.')
        expect(res.text).not.toContain('500')
        expect(res.text).not.toContain('[Something went wrong]')
        expect(res.text).not.toContain('Error: API error')
        expect(logger.error).toHaveBeenCalledWith("Error handling request for '/', user 'user1'", expect.any(Error))
      })
  })
})

describe('API 404', () => {
  const apiError: SanitisedError = new NotFound('API not found error')
  apiError.responseStatus = 404
  apiError.data = { developerMessage: '[Something not found]' }

  beforeEach(() => {
    auditService.logPageView.mockRejectedValue(apiError)
  })

  it('should render Not found page with stack in dev mode', () => {
    return request(appWithAllRoutes({ services: { auditService } }))
      .get('/')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(auditService.logPageView).toHaveBeenCalled()
        expect(res.text).toContain('Page not found')
        expect(res.text).toContain('404')
        expect(res.text).toContain('[Something not found]')
        expect(res.text).toContain('NotFoundError: API not found error')
        expect(logger.error).toHaveBeenCalledWith("Error handling request for '/', user 'user1'", expect.any(Error))
      })
  })

  it('should render Not found page without stack in production mode', () => {
    return request(appWithAllRoutes({ production: true, services: { auditService } }))
      .get('/')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(auditService.logPageView).toHaveBeenCalled()
        expect(res.text).toContain('Page not found')
        expect(res.text).not.toContain('404')
        expect(res.text).not.toContain('[Something not found]')
        expect(res.text).not.toContain('NotFoundError: API not found error')
        expect(logger.error).toHaveBeenCalledWith("Error handling request for '/', user 'user1'", expect.any(Error))
      })
  })
})
