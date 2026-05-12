/* istanbul ignore file */

import type { Request, Response, NextFunction } from 'express'
import type { HTTPError } from 'superagent'
import logger from '../logger'
import paths from './paths/ui'

export default function createErrorHandler(production: boolean) {
  return (error: HTTPError, req: Request, res: Response, next: NextFunction): void => {
    logger.error(`Error handling request for '${req.originalUrl}', user '${res.locals.user?.username}'`, error)

    if (error.status === 401 || error.status === 403) {
      return res.redirect(paths.static.notAuthorised({}))
    }

    if (error.status === 404) {
      res.status(404)
      return res.render('pages/static/not-found')
    }

    res.locals.message = production ? 'Sorry, there is a problem with the service' : error.message
    res.locals.status = production ? null : error.status
    res.locals.stack = production ? 'Try again later.' : error.stack

    res.status(error.status || 500)

    return res.render('pages/error')
  }
}
