import { Request } from 'express'
import { OtherAccommodationReferralDto } from '@sas/api'
import { dateFieldParts, isoDateToDateInput } from './dates'
import {
  validateAndFlashErrors,
  validateDateField,
  validateDateTodayOrPast,
  validateDateWithinLastXMonths,
  validateMandatoryText,
  validateMaxLength,
} from './validation'

export const validateSubmission = (req: Request) => {
  const { organisationName, referenceNumber, submissionNote } = req.body
  const submissionDateParts = dateFieldParts(req.body, 'submissionDate')
  const errors: Record<string, string> = {
    organisationName: validateMandatoryText(organisationName, 'organisation name'),
    submissionDate:
      validateDateField(submissionDateParts, 'Date', 'Year') ||
      validateDateTodayOrPast(submissionDateParts, 'Date') ||
      validateDateWithinLastXMonths(submissionDateParts, 6, 'Date'),
    referenceNumber: validateMaxLength(referenceNumber, 'reference number', 255),
    submissionNote: validateMaxLength(submissionNote, 'Notes', 4000),
  }

  return validateAndFlashErrors(req, errors, ['submissionDate'])
}

export const submissionFormValues = (referral: OtherAccommodationReferralDto | undefined): Record<string, string> => {
  if (!referral) return {}

  return {
    ...isoDateToDateInput(referral.submission?.submissionDate, 'submissionDate'),
    referenceNumber: referral.submission?.referenceNumber,
    submissionNote: referral.submission?.submissionNote,
    organisationName: referral.submission?.organisationName,
  }
}
