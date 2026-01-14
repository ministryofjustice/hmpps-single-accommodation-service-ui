import type { Request, Response, Express } from 'express'
import request from 'supertest'
import { mock } from 'jest-mock-extended'
import { appWithAllRoutes, user } from './testutils/appSetup'
import logger from '../../logger'
import CasesController from '../controllers/casesController'

const mockHandler = jest.fn(() => (req: Request, res: Response) => res.send('ok'))

const casesController = mock<CasesController>({
  index: mockHandler,
  search: mockHandler,
  show: mockHandler,
})

jest.mock('../controllers', () => ({
  controllers: () => ({
    casesController,
  }),
}))

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    userSupplier: () => user,
  })
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('Routing', () => {
  it('GET / should render index page', async () => {
    await request(app)
      .get('/')
      .expect(200)
      .expect(() => {
        expect(casesController.index).toHaveBeenCalled()
      })
  })
})

describe('error handling', () => {
  it('service errors are handled', () => {
    jest.spyOn(logger, 'error').mockImplementation()
    casesController.index.mockReturnValue(() => {
      throw new Error('Some problem calling external api!')
    })

    app = appWithAllRoutes({
      userSupplier: () => user,
    })

    return request(app)
      .get('/')
      .expect('Content-Type', /html/)
      .expect(500)
      .expect(res => {
        expect(res.text).toContain('Some problem calling external api!')
      })
  })
})
