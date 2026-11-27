import { CommissionedRehabilitativeServicesDto, ServiceResultV2 } from '@sas/api'
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
      result: Partial<ServiceResultV2>
      submission?: CommissionedRehabilitativeServicesDto
    }[] = [
      { title: 'NOT_REQUIRED', result: { serviceStatus: 'CRS_NOT_REQUIRED' } },
      { title: 'UPSTREAM_ERROR', result: { serviceStatus: 'CRS_UPSTREAM_ERROR' } },
      {
        title: 'UPCOMING_REFERRAL',
        result: { serviceStatus: 'CRS_UPCOMING_REFERRAL', actionStartDate: '2027-03-25' },
      },
      {
        title: 'UPCOMING_ACCOMMODATION_REFERRAL',
        result: { serviceStatus: 'CRS_UPCOMING_ACCOMMODATION_REFERRAL', actionStartDate: '2027-03-25' },
      },
      { title: 'UPCOMING_WITHOUT_DATE', result: { serviceStatus: 'CRS_UPCOMING_REFERRAL' } },
      {
        title: 'NOT_STARTED_REFERRAL',
        result: { serviceStatus: 'CRS_NOT_STARTED_REFERRAL', url: 'https://example.com/start' },
      },
      {
        title: 'NOT_STARTED_ACCOMMODATION_REFERRAL',
        result: { serviceStatus: 'CRS_NOT_STARTED_ACCOMMODATION_REFERRAL', url: 'https://example.com/start' },
      },
      {
        title: 'SUBMITTED',
        result: {
          serviceStatus: 'CRS_SUBMITTED',
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
          serviceStatus: 'CRS_NOT_REQUIRED',
          actionStartDate: undefined,
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
