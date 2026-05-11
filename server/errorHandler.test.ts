import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes } from './routes/testutils/appSetup'
import logger from '../logger'

let app: Express

jest.mock('../logger')

beforeEach(() => {
  app = appWithAllRoutes({})
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET 500', () => {
  it('should render content with stack in dev mode', () => {
    return request(app)
      .get('/')
      .expect(500)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Cannot read properties of undefined')
        expect(res.text).not.toContain('Sorry, there is a problem with the service.')
        expect(logger.error).toHaveBeenCalledWith("Error handling request for '/', user 'user1'", expect.any(Error))
      })
  })

  it('should render content without stack in production mode', () => {
    return request(appWithAllRoutes({ production: true }))
      .get('/')
      .expect(500)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Sorry, there is a problem with the service.')
        expect(res.text).not.toContain('Cannot read properties of undefined')
        expect(logger.error).toHaveBeenCalledWith("Error handling request for '/', user 'user1'", expect.any(Error))
      })
  })
})

describe('GET 404', () => {
  it('should render not found page', () => {
    return request(app)
      .get('/unknown')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Page not found')
        expect(logger.error).toHaveBeenCalledWith(
          "Error handling request for '/unknown', user 'user1'",
          expect.any(Error),
        )
      })
  })
})
