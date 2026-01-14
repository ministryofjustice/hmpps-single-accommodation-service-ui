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
  return Object.entries(errors).map(([field, text]) => errorSummary(field, text))
}

export const generateErrorMessages = (errors: Record<string, string>): ErrorMessages => {
  return Object.entries(errors).reduce<ErrorMessages>((errorMessages, [field, text]) => {
    return {
      ...errorMessages,
      [field]: errorMessage(field, text),
    }
  }, {})
}
