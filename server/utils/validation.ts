import { Request } from 'express'

// eslint-disable-next-line import/prefer-default-export
export const fetchErrors = (request: Request) => {
  const errorsFlash = request.flash('errors')
  const errorSummaryFlash = request.flash('errorSummary')

  const errors = errorsFlash?.length ? JSON.parse(errorsFlash[0]) : {}
  const errorSummary = errorSummaryFlash?.length ? JSON.parse(errorSummaryFlash[0]) : []

  return { errors, errorSummary }
}
