import type { Request, RequestHandler, Response } from 'express'

export default class StaticController {
  notAuthorised(): RequestHandler {
    return (_req: Request, res: Response) => {
      res.render('pages/static/not-authorised')
    }
  }

  maintenance(): RequestHandler {
    return (_req: Request, res: Response) => {
      res.render('pages/static/maintenance')
    }
  }
}
