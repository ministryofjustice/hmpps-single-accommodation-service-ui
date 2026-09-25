import { Request } from 'express'
import { mock } from 'jest-mock-extended'
import * as validationUtils from './validation'

import { detailsSummaryListRows, otherReferralCards, submissionFormValues, validateSubmission } from './otherReferrals'
import { otherAccommodationReferralFactory, otherAccommodationReferralSubmissionFactory } from '../testutils/factories'
import { formatDateAndDaysAgo } from './dates'

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
  describe('details lists', () => {
    const referral = otherAccommodationReferralFactory.build({
      status: 'SUBMITTED',
      crn: 'CRN1234',
      submission: {
        submissionDate: '2026-06-13',
        referenceNumber: 'REF',
        website: 'Web.com',
        submissionNote: 'Note',
        createdByUsername: 'username',
        organisationName: 'Org Name',
        id: 'submission-id',
      },
    })
    describe('otherReferralCards', () => {
      it('should render a set of referral status cards for the person tracker page', () => {
        expect(otherReferralCards([referral])).toEqual([
          {
            details: [
              { key: { text: 'Submitted' }, value: { text: '13 June 2026' } },
              { key: { text: 'Submitted by' }, value: { text: 'username' } },
              { key: { text: 'Reference' }, value: { text: 'REF' } },
            ],
            heading: 'Org Name',
            links: [
              {
                external: false,
                href: '/cases/CRN1234/other-referrals/submission-id/details',
                text: 'View details',
              },
            ],
            status: { colour: 'yellow', text: 'Submitted' },
          },
        ])
      })
    })

    describe('detailsSummaryListRows', () => {
      it('should render the details for a referral', () => {
        expect(detailsSummaryListRows(referral)).toEqual([
          {
            key: { text: 'Status' },
            value: { html: '<strong class="govuk-tag govuk-tag--yellow">Submitted</strong>' },
          },
          { key: { text: 'Submitted on' }, value: { text: formatDateAndDaysAgo('2026-06-13') } },
          { key: { text: 'Reference number' }, value: { text: 'REF' } },
          {
            key: { text: 'Phone number' },
            value: { html: '<span class="sas-colour--dark-grey">No number added</span>' },
          },
          { key: { text: 'Email' }, value: { html: '<span class="sas-colour--dark-grey">No email added</span>' } },
          { key: { text: 'Website' }, value: { text: 'Web.com' } },
          { key: { text: 'Note' }, value: { html: '<div class="sas-text-block">Note</div>' } },
        ])
      })
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
