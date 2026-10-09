import { Request } from 'express'
import { mock } from 'jest-mock-extended'
import { faker } from '@faker-js/faker'
import * as validationUtils from './validation'

import {
  detailsSummaryListRows,
  externalReferralCards,
  submissionFormValues,
  validateSubmission,
} from './externalReferrals'
import { externalReferralFactory, externalReferralSubmissionFactory } from '../testutils/factories'
import { formatDateAndDaysAgo } from './dates'

describe('externalReferrals utils', () => {
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

    it('validates email, notes and phone number if entered', () => {
      req.body = {
        organisationName: 'some-organisation',
        'submissionDate-day': '1',
        'submissionDate-month': '2',
        'submissionDate-year': '2025',
      }

      const result = validateSubmission(req)

      expect(result).toBe(true)
    })

    it('returns true when submission date, local authority, and reference number are valid', () => {
      req.body = {
        organisationName: 'some-organisation',
        'submissionDate-day': '1',
        'submissionDate-month': '2',
        'submissionDate-year': '2025',
        phoneNumber: '123',
        email: 'invalid-email',
        submissionNote: faker.string.alphanumeric({ length: 4001 }),
        referenceNumber: faker.string.alphanumeric({ length: 256 }),
        website: 'invalid-website',
      }

      const result = validateSubmission(req)

      expect(validationUtils.validateAndFlashErrors).toHaveBeenCalledWith(
        req,
        {
          email: 'Enter a valid email address',
          phoneNumber: 'Enter a UK phone number',
          submissionNote: 'Notes must be 4,000 characters or less',
          referenceNumber: 'Reference number must be 255 characters or less',
          website: 'Enter a valid website address',
        },
        ['submissionDate'],
      )

      expect(result).toBe(false)
    })
  })

  describe('details lists', () => {
    const referral = externalReferralFactory.build({
      status: 'SUBMITTED',
      crn: 'CRN1234',
      submission: {
        submissionDate: '2026-06-13',
        referenceNumber: 'REF',
        website: 'Web.com',
        submissionNote: 'Note',
        email: 'email@justice.gov.uk',
        phoneNumber: '123456789',
        createdByUsername: 'username',
        createdBy: 'created-by',
        organisationName: 'Org Name',
        id: 'submission-id',
      },
    })

    describe('externalReferralCards', () => {
      beforeEach(() => {
        jest.useFakeTimers().setSystemTime(new Date('2026-06-18'))
      })

      afterEach(() => {
        jest.useRealTimers()
      })

      it('should render a set of referral status cards for the person tracker page', () => {
        expect(externalReferralCards([referral])).toEqual([
          {
            details: [
              { key: { text: 'Reference' }, value: { text: 'REF' } },
              { key: { text: 'Submitted' }, value: { text: '13 June 2026 (5 days ago)' } },
              { key: { text: 'Submitted by' }, value: { text: 'created-by' } },
            ],
            heading: 'Org Name',
            links: [
              {
                external: false,
                href: '/cases/CRN1234/external-referrals/submission-id/details',
                text: 'View details',
              },
            ],
            status: { colour: 'yellow', text: 'Submitted' },
          },
        ])
      })

      it('should render a default value if no reference is provided', () => {
        expect(
          externalReferralCards([
            { ...referral, submission: { ...referral.submission, referenceNumber: undefined } },
          ])[0],
        ).toEqual(
          expect.objectContaining({
            details: [
              { key: { text: 'Reference' }, value: { text: 'No reference added' } },
              { key: { text: 'Submitted' }, value: { text: '13 June 2026 (5 days ago)' } },
              { key: { text: 'Submitted by' }, value: { text: 'created-by' } },
            ],
          }),
        )
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
            value: { text: '123456789' },
          },
          { key: { text: 'Email' }, value: { text: 'email@justice.gov.uk' } },
          { key: { text: 'Website' }, value: { text: 'Web.com' } },
          { key: { text: 'Note' }, value: { html: '<div class="sas-text-block">Note</div>' } },
        ])
      })
    })
  })

  describe('submissionFormValues', () => {
    it('maps submission values from referral', () => {
      const referral = externalReferralFactory.build({
        submission: externalReferralSubmissionFactory.build({
          submissionDate: '2025-03-01',
        }),
      })
      const {
        submission: { organisationName, referenceNumber, website, email, phoneNumber, submissionNote },
      } = referral
      expect(submissionFormValues(referral)).toEqual({
        organisationName,
        referenceNumber,
        'submissionDate-day': '01',
        'submissionDate-month': '03',
        'submissionDate-year': '2025',
        website,
        phoneNumber,
        email,
        submissionNote,
      })
    })
  })
})
