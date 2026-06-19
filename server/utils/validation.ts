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

export const addUserInputToFlash = (request: Request): void => {
  request.flash('userInput', JSON.stringify(request.body))
}

export const validateAndFlashErrors = (request: Request, errors: Record<string, string>): boolean => {
  const errorMessages = generateErrorMessages(errors)
  const errorSummary = generateErrorSummary(errors)

  if (errorSummary.length === 0) {
    return true
  }

  request.flash('errors', JSON.stringify(errorMessages))
  request.flash('errorSummary', JSON.stringify(errorSummary))
  addUserInputToFlash(request)

  return false
}

export const isValidUKPostcode = (postcode: string): boolean => /^[a-z]{1,2}\d[a-z\d]?\s*\d[a-z]{2}$/i.test(postcode)

export const aOrAn = (noun: string): string => (/^[aeiou]/i.test(noun) ? 'an' : 'a')

export const validateMandatoryText = (
  value: string | undefined,
  label: string,
  prefix: string = aOrAn(label),
): string | undefined => (value ? undefined : `Enter ${prefix} ${label}`)

export const validateRadioButton = (
  value: string | undefined,
  label: string,
  prefix: string = aOrAn(label),
): string | undefined => (value ? undefined : `Select ${prefix} ${label}`)

export const validateSelect = (
  value: string | undefined,
  label: string,
  prefix: string = aOrAn(label),
): string | undefined => (value ? undefined : `Select ${prefix} ${label}`)

export const validateAutocomplete = (
  value: string | undefined,
  label: string,
  prefix: string = aOrAn(label),
): string | undefined => (value ? undefined : `Select ${prefix} ${label} from the list`)

export const validateMaxLength = (
  value: string | undefined,
  label: string,
  maxLength: number,
): string | undefined => (value && value.length > maxLength ? `${label} must be ${maxLength} characters or less` : undefined)

export const validatePostcode = (value: string | undefined): string | undefined => {
  if (!value) return 'Enter a UK postcode'
  return isValidUKPostcode(value) ? undefined : 'Enter a full UK postcode, like AA3 1AB'
}
