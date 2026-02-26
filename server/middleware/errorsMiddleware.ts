import { RequestHandler } from 'express'
import { fetchErrors } from '../utils/validation'

const errorsMiddleware: RequestHandler = (req, res, next) => {
  const { errors, errorSummary } = fetchErrors(req)
  res.locals.errors = errors
  res.locals.errorSummary = errorSummary
  next()
}

export default errorsMiddleware
