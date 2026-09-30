import { Request } from 'express'
import { mock } from 'jest-mock-extended'
import * as validationUtils from './validation'

import { submissionFormValues, validateSubmission } from './otherReferrals'
import { otherAccommodationReferralFactory, otherAccommodationReferralSubmissionFactory } from '../testutils/factories'

describe('otherReferrals utils', () => {
  let req: Request

  describe('validateSubmission', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      req = mock<Request>({
        params: { crn: 'CRN123' },
        body: {},
        session: {},
      })
      jest.spyOn(validationUtils, 'validateAndFlashErrors')
      jest.useFakeTimers().setSystemTime(new Date('2025-03-01'))
    })

    it('sets errors and returns false when organisation and submission date are missing', () => {
      req.body = {}
      const result = validateSubmission(req)

      expect(validationUtils.validateAndFlashErrors).toHaveBeenCalledWith(
        req,
        {
          organisationName: 'Enter an organisation name',
          submissionDate: 'Enter a date',
        },
        ['submissionDate'],
      )
      expect(result).toEqual(false)
    })

    it.each([
      { title: 'in the future', date: '2025-03-02', error: 'Date must be today or in the past' },
      { title: 'more than 6 months in the past', date: '2024-07-03', error: 'Date must be within the last 6 months' },
    ])('sets a date error if the submission date is $title', ({ date, error }) => {
      const [year, month, day] = date.split('-').map(String)
      req.body = {
        organisationName: 'some-organisation',
        'submissionDate-day': day,
        'submissionDate-month': month,
        'submissionDate-year': year,
      }

      const result = validateSubmission(req)

      expect(validationUtils.validateAndFlashErrors).toHaveBeenCalledWith(
        req,
        {
          submissionDate: error,
        },
        ['submissionDate'],
      )
      expect(result).toEqual(false)
    })

    it('returns true when submission date, local authority, and reference number are valid', () => {
      req.body = {
        organisationName: 'some-organisation',
        'submissionDate-day': '1',
        'submissionDate-month': '2',
        'submissionDate-year': '2025',
      }

      const result = validateSubmission(req)

      expect(result).toBe(true)
    })
  })

  describe('submissionFormValues', () => {
    it('maps submission values from referral', () => {
      const referral = otherAccommodationReferralFactory.build({
        submission: otherAccommodationReferralSubmissionFactory.build({
          submissionDate: '2025-03-01',
        }),
      })
      expect(submissionFormValues(referral)).toEqual({
        organisationName: referral.submission.organisationName,
        referenceNumber: referral.submission.referenceNumber,
        'submissionDate-day': '01',
        'submissionDate-month': '03',
        'submissionDate-year': '2025',
      })
    })
  })
})
