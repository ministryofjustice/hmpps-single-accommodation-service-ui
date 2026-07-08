import { Request } from 'express'
import type { DateFieldParts, ErrorMessage, ErrorMessages, ErrorSummary } from '@sas/ui'
import { datePartsToUtcDate, getTodayUtcDate } from './dates'

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

export const errorDateParts = (text: string): string[] => {
  const dateFields = ['day', 'month', 'year']
  const found = dateFields.filter(part => text.includes('must include') && text.toLowerCase().includes(part))
  return found.length ? found : dateFields
}

export const errorSummaryItem = (field: string, text: string, isDateField = false): ErrorSummary => {
  return {
    text,
    href: isDateField ? `#${field}-${errorDateParts(text)[0]}` : `#${field}`,
  }
}

export const errorMessage = (text: string): ErrorMessage => {
  return {
    text,
  }
}

export const generateErrorSummary = (
  errors: Record<string, string>,
  dateFields: string[] = [],
): Array<ErrorSummary> => {
  if (!errors) return []
  return Object.entries(errors)
    .filter(([_, text]) => text)
    .map(([field, text]) => errorSummaryItem(field, text, dateFields.includes(field)))
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

export const validateAndFlashErrors = (
  request: Request,
  errors: Record<string, string>,
  dateFields: string[] = [],
): boolean => {
  const errorMessages = generateErrorMessages(errors)
  const errorSummary = generateErrorSummary(errors, dateFields)

  if (errorSummary.length === 0) {
    return true
  }

  request.flash('errors', JSON.stringify(errorMessages))
  request.flash('errorSummary', JSON.stringify(errorSummary))
  addUserInputToFlash(request)

  return false
}

const isValidUKPostcode = (postcode: string): boolean => /^[a-z]{1,2}\d[a-z\d]?\s*\d[a-z]{2}$/i.test(postcode)

const aOrAn = (noun: string): string => (/^[aeiou]/i.test(noun) ? 'an' : 'a')

const isBlank = (value: string | undefined): boolean => !value

const validateRequired = (
  value: string | undefined,
  label: string,
  action: string = 'Enter',
  prefix: string = aOrAn(label),
  suffix: string = '',
): string | undefined => (!isBlank(value) ? undefined : `${action} ${prefix} ${label}${suffix ? ` ${suffix}` : ''}`)

export const validateMandatoryText = (
  value: string | undefined,
  label: string,
  prefix: string = aOrAn(label),
): string | undefined => validateRequired(value, label, 'Enter', prefix)

export const validateRadioButton = (
  value: string | undefined,
  label: string,
  prefix: string = aOrAn(label),
): string | undefined => validateRequired(value, label, 'Select', prefix)

export const validateSelect = (
  value: string | undefined,
  label: string,
  prefix: string = aOrAn(label),
): string | undefined => validateRequired(value, label, 'Select', prefix)

export const validateAutocomplete = (
  value: string | undefined,
  label: string,
  prefix: string = aOrAn(label),
): string | undefined => validateRequired(value, label, 'Select', prefix, 'from the list')

export const validateMaxLength = (value: string | undefined, label: string, maxLength: number): string | undefined =>
  value && value.length > maxLength ? `${label} must be ${maxLength.toLocaleString('en-GB')} characters or less` : undefined

const blankDateParts = ({ day, month, year }: DateFieldParts): string[] => {
  const blankParts: string[] = []
  if (isBlank(day)) blankParts.push('day')
  if (isBlank(month)) blankParts.push('month')
  if (isBlank(year)) blankParts.push('year')
  return blankParts
}

const validateDateFull = (parts: DateFieldParts, label: string, prefix: string = aOrAn(label)): string | undefined =>
  blankDateParts(parts).length === 3 ? `Enter ${prefix} ${label}` : undefined

const validateDateParts = (parts: DateFieldParts, label: string): string | undefined => {
  const blankParts = blankDateParts(parts)

  if (blankParts.length === 0 || blankParts.length === 3) return undefined
  if (blankParts.length === 1) return `${label} must include a ${blankParts[0]}`

  return `${label} must include a ${blankParts[0]} and a ${blankParts[1]}`
}

const validateDateYearLength = (
  { year }: DateFieldParts,
  label: string,
  yearLabel: string = `${label} year`,
): string | undefined => (!isBlank(year) && year.length !== 4 ? `${yearLabel} must include 4 numbers` : undefined)

const isRealDate = ({ day = '', month = '', year = '' }: DateFieldParts): boolean => {
  if (!/^\d{1,2}$/.test(day) || !/^\d{1,2}$/.test(month) || !/^\d{1,4}$/.test(year)) return false

  const dayNumber = Number(day)
  const monthNumber = Number(month)
  const yearNumber = Number(year)

  const parsed = new Date(Date.UTC(yearNumber, monthNumber - 1, dayNumber))
  return (
    parsed.getUTCFullYear() === yearNumber &&
    parsed.getUTCMonth() === monthNumber - 1 &&
    parsed.getUTCDate() === dayNumber
  )
}

const validateRealDate = (parts: DateFieldParts, label: string): string | undefined => {
  if (blankDateParts(parts).length > 0) return undefined
  return isRealDate(parts) ? undefined : `${label} must be a real date`
}

export const validateDateInPast = (parts: DateFieldParts, label: string): string | undefined => {
  if (!isRealDate(parts)) return undefined

  const date = datePartsToUtcDate(parts)
  const today = getTodayUtcDate()
  return date >= today ? `${label} must be in the past` : undefined
}

export const validateDateTodayOrPast = (parts: DateFieldParts, label: string): string | undefined => {
  if (!isRealDate(parts)) return undefined

  const date = datePartsToUtcDate(parts)
  const today = getTodayUtcDate()
  return date > today ? `${label} must be today or in the past` : undefined
}

export const validateDateNotBefore = (
  endDate: DateFieldParts,
  startDate: DateFieldParts,
  endDateLabel: string,
  startDateLabel: string,
): string | undefined => {
  if (!isRealDate(endDate) || !isRealDate(startDate)) return undefined

  return datePartsToUtcDate(endDate) < datePartsToUtcDate(startDate)
    ? `The ${endDateLabel} cannot be before the ${startDateLabel}`
    : undefined
}

export const validateDateWithinLastXMonths = (dateParts: DateFieldParts, months: number, label: string) => {
  if (!isRealDate(dateParts)) return undefined

  const now = getTodayUtcDate()
  const monthsAgo = new Date(now.setUTCMonth(now.getUTCMonth() - months))

  return datePartsToUtcDate(dateParts) < monthsAgo
    ? `${label} must be within the last ${months === 1 ? 'month' : `${months} months`}`
    : undefined
}

export const validateDateField = (parts: DateFieldParts, label: string, yearLabel?: string): string | undefined =>
  validateDateFull(parts, label.toLowerCase()) ||
  validateDateParts(parts, label) ||
  validateDateYearLength(parts, label, yearLabel) ||
  validateRealDate(parts, label)

export const validatePostcode = (value: string | undefined): string | undefined => {
  if (!value) return 'Enter a UK postcode'
  return isValidUKPostcode(value) ? undefined : 'Enter a valid UK postcode'
}
