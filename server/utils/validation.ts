import { Request } from 'express'
import type { ErrorMessage, ErrorMessages, ErrorSummary } from '@sas/ui'

export const fetchErrors = (request: Request) => {
  const errorsFlash = request.flash('errors')
  const errorSummaryFlash = request.flash('errorSummary')

  const errors = errorsFlash?.length ? JSON.parse(errorsFlash[0]) : {}
  const errorSummary = errorSummaryFlash?.length ? JSON.parse(errorSummaryFlash[0]) : []

  return { errors, errorSummary }
}

export const errorSummary = (field: string, text: string): ErrorSummary => {
  return {
    text,
    href: `#${field}`,
  }
}

export const errorMessage = (field: string, text: string): ErrorMessage => {
  return {
    text,
    attributes: {
      [`data-cy-error-${field}`]: true,
    },
  }
}

export const generateErrorSummary = (errors: Record<string, string>): Array<ErrorSummary> => {
  if (!errors) return []
  return Object.entries(errors)
    .filter(([_, text]) => text)
    .map(([field, text]) => errorSummary(field, text))
}

export const generateErrorMessages = (errors: Record<string, string>): ErrorMessages => {
  if (!errors) return {}
  return Object.entries(errors)
    .filter(([_, text]) => text)
    .reduce<ErrorMessages>((errorMessages, [field, text]) => {
      return {
        ...errorMessages,
        [field]: errorMessage(field, text),
      }
    }, {})
}

export const addErrorToFlash = (request: Request, field: string, error: string): void => {
  const errors = { [field]: error }
  request.flash('errors', JSON.stringify(generateErrorMessages(errors)))
  request.flash('errorSummary', JSON.stringify(generateErrorSummary(errors)))
}
