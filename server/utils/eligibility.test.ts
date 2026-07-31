import { ServiceResult } from '@sas/api'
import { eligibilityStatusCard, eligibilityToEligibilityCards, linksForService } from './eligibility'
import {
  crsServiceResultFactory,
  crsSubmissionFactory,
  eligibilityFactory,
  serviceResultFactory,
} from '../testutils/factories'

describe('linksForService', () => {
  const testCases = [
    { service: 'cas1', status: 'NOT_STARTED', expected: ['Start application'] },
    { service: 'cas1', status: 'NOT_SUBMITTED', expected: ['Continue application'] },
    { service: 'cas1', status: 'APPLICATION_REJECTED', expected: ['Start new application'] },
    { service: 'cas1', status: 'SUBMITTED', expected: ['View application'] },
    { service: 'cas1', status: 'INFO_REQUESTED', expected: ['View application'] },
    { service: 'cas1', status: 'PLACEMENT_BOOKED', expected: ['View application'] },
    { service: 'cas1', status: 'PLACEMENT_REQUEST_SUBMITTED', expected: ['View application'] },
    { service: 'cas1', status: 'NOT_ARRIVED', expected: ['Create new placement request'] },
    { service: 'cas1', status: 'PLACEMENT_CANCELLED', expected: ['Create new placement request'] },
    { service: 'cas1', status: 'PLACEMENT_REQUEST_REJECTED', expected: ['Create new placement request'] },
    { service: 'cas1', status: 'PLACEMENT_REQUEST_WITHDRAWN', expected: ['Create new placement request'] },
    { service: 'cas1', status: 'PLACEMENT_REQUEST_NOT_STARTED', expected: ['Create placement request'] },
    { service: 'cas1', status: 'NOT_ELIGIBLE', expected: undefined },
    { service: 'cas1', status: 'UPCOMING', expected: undefined },
    { service: 'cas3', status: 'NOT_STARTED', expected: ['Start referral'] },
    { service: 'cas3', status: 'SUBMITTED', expected: ['View referral'] },
    { service: 'cas3', status: 'BEDSPACE_OFFERED', expected: ['View referral'] },
    { service: 'cas3', status: 'BOOKING_CONFIRMED', expected: ['View referral'] },
    { service: 'cas3', status: 'BOOKING_CANCELLED', expected: ['View referral'] },
    { service: 'cas3', status: 'REJECTED', expected: ['Start new referral'] },
    { service: 'cas3', status: 'CANNOT_START_YET', expected: undefined },
    { service: 'cas3', status: 'NOT_ELIGIBLE', expected: undefined },
    { service: 'cas3', status: 'UPCOMING', expected: undefined },
  ]

  it.each(testCases)(
    'returns correct links for $service and status $status',
    ({
      service,
      status,
      expected,
    }: {
      service: 'cas1' | 'cas3'
      status: ServiceResult['serviceStatus']
      expected: string[]
    }) => {
      const serviceResult = serviceResultFactory.build({ serviceStatus: status, url: 'https://example.com' })
      const links = linksForService(service, serviceResult)

      if (expected === undefined) {
        expect(links).toBeUndefined()
      } else {
        links.forEach(link => expect(link.href).toBe('https://example.com'))
        expect(links?.map(link => link.text)).toEqual(expected)
      }
    },
  )
})

describe('eligibilityStatusCard', () => {
  // See: https://hmpps-single-accommodation-service-prototype-main.apps.live.cloud-platform.service.justice.gov.uk/10-0/_statuses?r=t
  const testCases: Record<'cas1' | 'cas3', { title: string; result: Partial<ServiceResult> }[]> = {
    cas1: [
      {
        title: 'NOT_ELIGIBLE',
        result: { serviceStatus: 'NOT_ELIGIBLE' },
      },
      {
        title: 'UPCOMING',
        result: {
          serviceStatus: 'UPCOMING',
          action: { type: 'START_APPROVED_PREMISE_APPLICATION', startDate: '2026-11-08' },
        },
      },
      {
        title: 'NOT_STARTED',
        result: { serviceStatus: 'NOT_STARTED', url: 'https://example.com/start' },
      },
      {
        title: 'SUBMITTED',
        result: { serviceStatus: 'NOT_SUBMITTED', url: 'https://example.com/view' },
      },
      {
        title: 'INFO_REQUESTED',
        result: { serviceStatus: 'INFO_REQUESTED', url: 'https://example.com/view' },
      },
      {
        title: 'APPLICATION_REJECTED',
        result: { serviceStatus: 'APPLICATION_REJECTED', url: 'https://example.com/start' },
      },
      {
        title: 'PLACEMENT_BOOKED',
        result: { serviceStatus: 'PLACEMENT_BOOKED', url: 'https://example.com/view' },
      },
      {
        title: 'NOT_ARRIVED',
        result: { serviceStatus: 'NOT_ARRIVED', url: 'https://example.com/create-new-placement-request' },
      },
      {
        title: 'PLACEMENT_CANCELLED',
        result: { serviceStatus: 'PLACEMENT_CANCELLED', url: 'https://example.com/create-new-placement-request' },
      },
      {
        title: 'PLACEMENT_REQUEST_NOT_STARTED',
        result: {
          serviceStatus: 'PLACEMENT_REQUEST_NOT_STARTED',
          url: 'https://example.com/create-placement-request',
        },
      },
      {
        title: 'PLACEMENT_REQUEST_SUBMITTED',
        result: { serviceStatus: 'PLACEMENT_REQUEST_SUBMITTED', url: 'https://example.com/view' },
      },
      {
        title: 'PLACEMENT_REQUEST_REJECTED',
        result: {
          serviceStatus: 'PLACEMENT_REQUEST_REJECTED',
          url: 'https://example.com/create-new-placement-request',
        },
      },
      {
        title: 'PLACEMENT_BOOKED',
        result: { serviceStatus: 'PLACEMENT_BOOKED', url: 'https://example.com/view' },
      },
      {
        title: 'PLACEMENT_REQUEST_WITHDRAWN',
        result: {
          serviceStatus: 'PLACEMENT_REQUEST_WITHDRAWN',
          url: 'https://example.com/create-new-placement-request',
        },
      },
      {
        title: 'WITHDRAWN',
        result: { serviceStatus: 'WITHDRAWN', url: 'https://example.com/start' },
      },
    ],
    cas3: [
      {
        title: 'NOT_ELIGIBLE',
        result: { serviceStatus: 'NOT_ELIGIBLE' },
      },
      // TODO: This status should be `DTR_REFERRAL_NOT_SUBMITTED`
      {
        title: 'CANNOT_START_YET, DTR needed',
        result: { serviceStatus: 'CANNOT_START_YET', failureReasons: ['DTR_REFERRAL_EXPIRED'] },
      },
      // TODO: This failure reason should be `MALE_CRS_NOT_SUBMITTED`
      {
        title: 'CANNOT_START_YET, men, CRS needed',
        result: { serviceStatus: 'CANNOT_START_YET', failureReasons: ['CRS_NOT_SUBMITTED'] },
      },
      // TODO: These failure reasons should be `DTR_REFERRAL_NOT_SUBMITTED` and `MALE_CRS_NOT_SUBMITTED`
      {
        title: 'CANNOT_START_YET, men, both DTR and CRS needed',
        result: { serviceStatus: 'CANNOT_START_YET', failureReasons: ['DTR_REFERRAL_EXPIRED', 'CRS_NOT_SUBMITTED'] },
      },
      // TODO: This failure reason should be `NON_MALE_CRS_NOT_SUBMITTED`
      {
        title: 'CANNOT_START_YET, women, CRS needed',
        result: { serviceStatus: 'CANNOT_START_YET', failureReasons: ['CRS_NOT_SUBMITTED'] },
      },
      // TODO: These failure reasons should be `DTR_REFERRAL_NOT_SUBMITTED` and `NON_MALE_CRS_NOT_SUBMITTED`
      {
        title: 'CANNOT_START_YET, women, both DTR and CRS needed',
        result: { serviceStatus: 'CANNOT_START_YET', failureReasons: ['DTR_REFERRAL_EXPIRED', 'CRS_NOT_SUBMITTED'] },
      },
      {
        title: 'UPCOMING',
        result: { serviceStatus: 'UPCOMING', action: { type: 'START_CAS3_REFERRAL', startDate: '2026-12-15' } },
      },
      {
        title: 'NOT_STARTED',
        result: { serviceStatus: 'NOT_STARTED', url: 'https://example.com/start' },
      },
      {
        title: 'SUBMITTED',
        result: { serviceStatus: 'SUBMITTED', url: 'https://example.com/view' },
      },
      {
        title: 'REJECTED',
        result: { serviceStatus: 'REJECTED', url: 'https://example.com/start-new' },
      },
      {
        title: 'BEDSPACE_OFFERED',
        result: { serviceStatus: 'BEDSPACE_OFFERED', url: 'https://example.com/view' },
      },
      {
        title: 'BOOKING_CONFIRMED',
        result: { serviceStatus: 'BOOKING_CONFIRMED', url: 'https://example.com/view' },
      },
      {
        title: 'BOOKING_CANCELLED',
        result: { serviceStatus: 'BOOKING_CANCELLED', url: 'https://example.com/view' },
      },
    ],
  }

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-31'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe.each(['cas1', 'cas3'] as const)('for %s', service => {
    it.each(testCases[service])('renders a $title status card', ({ result }) => {
      const serviceResult = serviceResultFactory.build({
        serviceStatus: 'NOT_REQUIRED',
        action: undefined,
        failureReasons: [],
        url: undefined,
        ...result,
      })

      expect(eligibilityStatusCard(service, serviceResult)).toMatchSnapshot()
    })
  })
})

describe('eligibilityToEligibilityCards', () => {
  const crn = 'X123456'

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-01-21'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('returns eligibility cards for each service', () => {
    const eligibility = eligibilityFactory.build({ crn })

    const cards = eligibilityToEligibilityCards(eligibility, crn)

    expect(cards).toHaveLength(4)
    expect(cards[0].heading).toContain('Duty to Refer (DTR)')
    expect(cards[1].heading).toContain('Commissioned Rehabilitative Services (CRS)')
    expect(cards[2].heading).toContain('Approved premises (CAS1)')
    expect(cards[3].heading).toContain('CAS3 (transitional accommodation)')
  })

  it('returns an array of eligibility card objects', () => {
    const eligibility = eligibilityFactory.build({
      crn,
      cas1: {
        serviceResult: serviceResultFactory.build({
          serviceStatus: 'NOT_STARTED',
          url: 'https://example.com/start-application',
        }),
      },
      cas3: {
        serviceResult: serviceResultFactory.build({
          serviceStatus: 'CONFIRMED',
          url: 'https://example.com/view-referral',
        }),
      },
      dtr: {
        serviceResult: serviceResultFactory.build({
          serviceStatus: 'ACCEPTED',
          url: 'https://example.com/view-details',
        }),
        submission: {
          id: 'some-id',
          submissionDate: '2025-12-01',
          referenceNumber: 'REF123',
          localAuthority: { localAuthorityAreaName: 'Some Council' },
          createdBy: 'user1',
          createdAt: '2025-12-01T10:00:00.000Z',
          outcomeReason: 'PREVENTION_AND_RELIEF_DUTY',
        },
      },
      crs: crsServiceResultFactory.build({
        serviceResult: serviceResultFactory.build({
          serviceStatus: 'SUBMITTED',
          url: 'https://example.com/view-referral',
        }),
        commissionedRehabilitativeServices: crsSubmissionFactory.build({
          submissionDate: '2025-11-30',
        }),
      }),
    })

    const cards = eligibilityToEligibilityCards(eligibility, crn)

    expect(cards).toMatchSnapshot()
  })
})
