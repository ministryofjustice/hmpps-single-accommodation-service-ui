import { CommissionedRehabilitativeServicesDto, ServiceResult } from '@sas/api'
import { crsStatusCard } from './crs'
import { crsServiceResultFactory, crsSubmissionFactory, serviceResultFactory } from '../testutils/factories'

describe('CRS utilities', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-09'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('crsStatusCard', () => {
    // See: https://hmpps-single-accommodation-service-prototype-main.apps.live.cloud-platform.service.justice.gov.uk/10-0/_statuses?r=t#crs
    const testCases: {
      title: string
      result: Partial<ServiceResult>
      submission?: CommissionedRehabilitativeServicesDto
    }[] = [
      { title: 'NOT_ELIGIBLE', result: { serviceStatus: 'NOT_ELIGIBLE' } },
      { title: 'NOT_REQUIRED', result: { serviceStatus: 'NOT_REQUIRED' } },
      {
        title: 'UPCOMING',
        result: {
          serviceStatus: 'UPCOMING',
          action: { type: 'SUBMIT_CRS_ACCOMMODATION_REFERRAL', startDate: '2027-03-25' },
        },
      },
      { title: 'NOT_STARTED', result: { serviceStatus: 'NOT_STARTED', url: 'https://example.com/start' } },
      {
        title: 'SUBMITTED',
        result: {
          serviceStatus: 'SUBMITTED',
          url: 'https://example.com/view-referral',
        },
        submission: crsSubmissionFactory.build({
          submissionDate: '2026-06-06',
        }),
      },
    ]

    it.each(testCases)('returns a status card for a $title CRS service result', ({ result, submission }) => {
      const crsServiceResult = crsServiceResultFactory.build({
        serviceResult: serviceResultFactory.build({
          serviceStatus: 'NOT_REQUIRED',
          action: undefined,
          failureReasons: [],
          url: undefined,
          ...result,
        }),
        commissionedRehabilitativeServices: submission,
      })

      expect(crsStatusCard(crsServiceResult)).toMatchSnapshot()
    })
  })
})
