import { Request } from 'express'
import type { ErrorMessage, ErrorMessages, ErrorSummary } from '@sas/ui'

export const fetchErrorsAndUserInput = (request: Request) => {
  const errorsFlash = request.flash('errors')
  const errorSummaryFlash = request.flash('errorSummary')
  const userInputFlash = request.flash('userInput')

  const errors = (errorsFlash || []).map(err => JSON.parse(err)).reduce((obj, error) => ({ ...obj, ...error }), {})
  const errorSummary = (errorSummaryFlash || []).map(err => JSON.parse(err)).flat()
  const userInput = (userInputFlash || [])
    .map(input => JSON.parse(input))
    .reduce((obj, input) => ({ ...obj, ...input }), {})

  return { errors, errorSummary, userInput }
}

export const errorSummaryItem = (field: string, text: string): ErrorSummary => {
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
    .map(([field, text]) => errorSummaryItem(field, text))
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
  validateAndFlashErrors(request, { [field]: error })
}

export const addGenericErrorToFlash = (request: Request, error: string): void => {
  request.flash('errorSummary', JSON.stringify([{ text: error }]))
}

export const flashUserInput = (request: Request, userInput: Record<string, unknown> = {}): void => {
  request.flash('userInput', JSON.stringify(userInput))
}

export const validateAndFlashErrors = (request: Request, errors: Record<string, string>): boolean => {
  if (Object.keys(errors).length === 0) {
    return true
  }

  flashUserInput(request, request.body)

  const errorMessages = generateErrorMessages(errors)
  const errorSummary = generateErrorSummary(errors)

  request.flash('errors', JSON.stringify(errorMessages))
  request.flash('errorSummary', JSON.stringify(errorSummary))

  return false
}

export const isValidUKPostcode = (postcode: string): boolean => /^[a-z]{1,2}\d[a-z\d]?\s*\d[a-z]{2}$/i.test(postcode)
