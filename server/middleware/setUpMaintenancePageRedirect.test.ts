import express, { Express } from 'express'
import type { Request, Response, NextFunction } from 'express'
import request from 'supertest'
import config from '../config'
import setUpMaintenancePageRedirect from './setUpMaintenancePageRedirect'

const setupApp = (): Express => {
  const app = express()

  app.use((req: Request, res: Response, next: NextFunction) => {
    next()
  })

  app.use(setUpMaintenancePageRedirect())

  const appPaths = ['/known', '/maintenance', '/health', '/sign-in', '/sign-in/callback']

  appPaths.forEach(path => {
    app.get(path, (_req: Request, res: Response) => {
      res.send(path.slice(1))
    })
  })

  return app
}

describe('setUpMaintenancePageRedirect', () => {
  let app: Express

  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe('when the IN_MAINTENANCE_MODE environment variable is set to false', () => {
    beforeEach(() => {
      config.flags.maintenanceMode = false
      app = setupApp()
    })

    it('should not redirect to /maintenance', () => {
      return request(app).get('/known').expect(200)
    })

    it('should redirect /maintenance to /', async () => {
      const response = await request(app).get('/maintenance').expect(302)
      expect(response.text).toContain('Found. Redirecting to /')
    })
  })

  describe('when the IN_MAINTENANCE_MODE environment variable is set to true', () => {
    beforeEach(() => {
      config.flags.maintenanceMode = true
      app = setupApp()
    })

    describe('and the requested page should be redirected', () => {
      it('should redirect to the maintenance page', async () => {
        const response = await request(app).get('/known').expect(302)
        expect(response.text).toContain('Found. Redirecting to /maintenance')
      })
    })

    describe('and the requested page should not be redirected', () => {
      it.each([
        ['health endpoint', '/health'],
        ['maintenance page', '/maintenance'],
        ['sign-in page', '/sign-in'],
        ['sign-in callback page', '/sign-in/callback'],
      ])('should not redirect requests for the %s at %s', (_, path) => {
        return request(app).get(path).expect(200)
      })
    })
  })
})
