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
      staticController.notAuthorised()(request, response, next)

      expect(response.render).toHaveBeenCalledWith('pages/static/not-authorised')
    })
  })

  describe('maintenance', () => {
    it('should render the maintenance page', () => {
      staticController.maintenance()(request, response, next)

      expect(response.render).toHaveBeenCalledWith('pages/static/maintenance')
    })
  })

  describe('notFound', () => {
    it('should render the not found page', () => {
      staticController.notFound()(request, response, next)

      expect(response.render).toHaveBeenCalledWith('pages/static/not-found')
    })
  })
})
