/* istanbul ignore file */

import type { Request, Response, NextFunction } from 'express'
import { HTTPError } from 'superagent'
import { SanitisedError } from '@ministryofjustice/hmpps-rest-client'
import logger from '../logger'
import paths from './paths/ui'

const isSanitisedError = (error: unknown): error is SanitisedError =>
  (error as SanitisedError).responseStatus !== undefined

export default function createErrorHandler(production: boolean) {
  return (error: HTTPError | SanitisedError, req: Request, res: Response, next: NextFunction): void => {
    logger.error(`Error handling request for '${req.originalUrl}', user '${res.locals.user?.username}'`, error)

    const status = isSanitisedError(error) ? error.responseStatus : error.status || 500

    if (status === 401 || status === 403) {
      return res.redirect(paths.static.notAuthorised({}))
    }

    if (!production) {
      res.locals.debugErrorData = {
        status,
        hint: isSanitisedError(error) ? (error.data as Record<string, string>)?.developerMessage : error.message,
        trace: error.stack,
      }
    }

    if (status === 404) {
      res.status(404)
      return res.render('pages/static/not-found')
    }

    res.status(status)

    return res.render('pages/static/error')
  }
}
