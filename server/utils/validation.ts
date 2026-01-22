import { Request } from 'express'
import type { ErrorMessage, ErrorMessages, ErrorSummary } from '@sas/ui'

export const fetchErrors = (request: Request) => {
  const errorsFlash = request.flash('errors')
  const errorSummaryFlash = request.flash('errorSummary')

  const errors = (errorsFlash || []).map(err => JSON.parse(err)).reduce((obj, error) => ({ ...obj, ...error }), {})
  const errorSummary = (errorSummaryFlash || []).map(err => JSON.parse(err)).flat()

  return { errors, errorSummary }
}

export const errorSummary = (field: string, text: string): ErrorSummary => {
  return {
    text,
    href: `#${field}`,
  }
}

export const errorMessage = (text: string): ErrorMessage => {
  return {
    text,
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
        [field]: errorMessage(text),
      }
    }, {})
}

export const addErrorToFlash = (request: Request, field: string, error: string): void => {
  const errors = { [field]: error }
  request.flash('errors', JSON.stringify(generateErrorMessages(errors)))
  request.flash('errorSummary', JSON.stringify(generateErrorSummary(errors)))
}
