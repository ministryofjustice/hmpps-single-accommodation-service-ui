import type { NextFunction, Request, Response } from 'express'

import { mock } from 'jest-mock-extended'
import StaticController from './staticController'

describe('StaticController', () => {
  const request = mock<Request>()
  const response = mock<Response>()
  const next = mock<NextFunction>()

  let staticController: StaticController

  beforeEach(() => {
    staticController = new StaticController()
  })

  describe('notAuthorised', () => {
    it('should render the not authorise page', () => {
      const requestHandler = staticController.notAuthorised()
      requestHandler(request, response, next)

      expect(response.render).toHaveBeenCalledWith('pages/static/not-authorised')
    })
  })

  describe('maintenance', () => {
    it('should render the maintenance page', () => {
      const requestHandler = staticController.maintenance()
      requestHandler(request, response, next)

      expect(response.render).toHaveBeenCalledWith('pages/static/maintenance')
    })
  })

  describe('notFound', () => {
    it('should render the not found page', () => {
      const requestHandler = staticController.notFound()
      requestHandler(request, response, next)

      expect(response.render).toHaveBeenCalledWith('pages/static/not-found')
    })
  })
})
