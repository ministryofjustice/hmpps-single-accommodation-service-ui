import { Cas1ServiceResult, ServiceResult } from '@sas/api'
import { Link, StatusCard } from '@sas/ui'
import {
  cas1StatusCard,
  cas2StatusCard,
  cas3StatusCard,
  eligibilityToEligibilityCards,
  linksForCas1Status,
  linksForCas2Status,
  linksForCas3Status,
} from './eligibility'
import config from '../config'
import {
  crsServiceResultFactory,
  crsSubmissionFactory,
  eligibilityFactory,
  serviceResultFactory,
} from '../testutils/factories'

const cas1Application: NonNullable<Cas1ServiceResult['cas1Application']> = {
  uiUrl: 'https://example.com/application',
  id: 'application-id',
  applicationStatus: 'AWAITING_ASSESSMENT',
  placementHistory: [],
  application: {
    id: 'application-summary-id',
    status: 'AWAITING_ASSESSMENT',
    createdAt: '2026-06-01',
    createdBy: { name: 'Joe Bloggs', username: 'joe.bloggs', staffCode: 'STAFF1' },
    submittedAt: '2026-06-02',
    expiresAt: '2027-01-29',
  },
  assessment: { decision: 'REJECTED', rejectionRationale: 'Not enough detail' },
  requestForPlacement: {
    status: 'REQUEST_SUBMITTED',
    submittedBy: { name: 'Joe Bloggs', username: 'joe.bloggs', staffCode: 'STAFF1' },
    submittedAt: '2026-06-10',
    rejectionReason: 'Over capacity',
    withdrawalReason: 'ERROR_IN_PLACEMENT_REQUEST',
    expectedArrivalDate: '2026-09-09',
    durationDays: 56,
  },
  placement: {
    status: 'ARRIVED',
    actualArrivalDate: '2026-09-01',
    actualDepartureDate: '2026-10-27',
    cancellationReason: 'Over capacity',
  },
}

describe('linksForService', () => {
  const linkBuilders: Record<'cas1' | 'cas2' | 'cas3', (serviceResult?: ServiceResult) => Link[]> = {
    cas1: linksForCas1Status,
    cas2: linksForCas2Status,
    cas3: linksForCas3Status,
  }

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
    { service: 'cas3', status: 'NOT_SUBMITTED', expected: ['Continue referral'] },
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
      service: 'cas1' | 'cas2' | 'cas3'
      status: ServiceResult['serviceStatus']
      expected: string[]
    }) => {
      const serviceResult = serviceResultFactory.build({ serviceStatus: status, url: 'https://example.com' })
      const links = linkBuilders[service](serviceResult)

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
  const testCases: Record<'cas1' | 'cas2' | 'cas3', { title: string; result: Partial<ServiceResult> }[]> = {
    cas1: [
      {
        title: 'NOT_ELIGIBLE',
        result: { serviceStatus: 'NOT_ELIGIBLE' },
      },
      {
        title: 'UPCOMING',
        result: {
          serviceStatus: 'UPCOMING',
          action: { type: 'START_APPROVED_PREMISE_APPLICATION', startDate: '2026-11-08', service: 'CAS1' },
        },
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
        title: 'NOT_SUBMITTED',
        result: { serviceStatus: 'NOT_SUBMITTED', url: 'https://example.com/continue' },
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
    cas2: [
      {
        title: 'NOT_STARTED',
        result: { serviceStatus: 'NOT_STARTED', url: 'https://example.com/start' },
      },
    ],
    cas3: [
      {
        title: 'NOT_ELIGIBLE',
        result: { serviceStatus: 'NOT_ELIGIBLE' },
      },
      {
        title: 'CANNOT_START_YET, DTR needed',
        result: { serviceStatus: 'CANNOT_START_YET', blockingStatusReason: 'SUBMIT_DTR_BEFORE_CAS3' },
      },
      {
        title: 'CANNOT_START_YET, CRS needed',
        result: { serviceStatus: 'CANNOT_START_YET', blockingStatusReason: 'SUBMIT_CRS_BEFORE_CAS3' },
      },
      {
        title: 'CANNOT_START_YET, both DTR and CRS needed',
        result: { serviceStatus: 'CANNOT_START_YET', blockingStatusReason: 'SUBMIT_DTR_AND_CRS_BEFORE_CAS3' },
      },
      {
        title: 'CANNOT_START_YET, CRS accommodation needed',
        result: { serviceStatus: 'CANNOT_START_YET', blockingStatusReason: 'SUBMIT_CRS_ACCOMMODATION_BEFORE_CAS3' },
      },
      {
        title: 'CANNOT_START_YET, both DTR and CRS accommodation needed',
        result: {
          serviceStatus: 'CANNOT_START_YET',
          blockingStatusReason: 'SUBMIT_DTR_AND_CRS_ACCOMMODATION_BEFORE_CAS3',
        },
      },
      {
        title: 'UPCOMING',
        result: {
          serviceStatus: 'UPCOMING',
          action: { type: 'START_CAS3_REFERRAL', startDate: '2026-12-15', service: 'CAS3' },
        },
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

  describe.each(['cas1', 'cas2', 'cas3'] as const)('for %s', service => {
    const cardBuilders: Record<'cas1' | 'cas2' | 'cas3', (result: ServiceResult) => StatusCard> = {
      cas1: result => cas1StatusCard({ serviceResult: result, cas1Application }),
      cas2: result => cas2StatusCard({ serviceResult: result }),
      cas3: result => cas3StatusCard({ serviceResult: result }),
    }

    it.each(testCases[service])('renders a $title status card', ({ result }) => {
      const serviceResult = serviceResultFactory.build({
        serviceStatus: 'NOT_REQUIRED',
        action: undefined,
        failureReasons: [],
        url: undefined,
        ...result,
      })

      expect(cardBuilders[service](serviceResult)).toMatchSnapshot()
    })
  })
})

describe('cas1 status card', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-01'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('details', () => {
    const detailStatuses: ServiceResult['serviceStatus'][] = [
      'NOT_SUBMITTED',
      'SUBMITTED',
      'INFO_REQUESTED',
      'APPLICATION_REJECTED',
      'PLACEMENT_BOOKED',
      'ARRIVED',
      'NOT_ARRIVED',
      'PLACEMENT_CANCELLED',
      'PLACEMENT_REQUEST_NOT_STARTED',
      'PLACEMENT_REQUEST_SUBMITTED',
      'PLACEMENT_REQUEST_REJECTED',
      'PLACEMENT_REQUEST_WITHDRAWN',
    ]

    it.each(detailStatuses)('renders detail rows for a %s status', status => {
      const serviceResult = serviceResultFactory.build({ serviceStatus: status })

      expect(cas1StatusCard({ serviceResult, cas1Application }).details).toMatchSnapshot()
    })
  })

  describe('content', () => {
    const serviceResult = serviceResultFactory.build({
      serviceStatus: 'PLACEMENT_REQUEST_NOT_STARTED',
    })

    describe('placement history', () => {
      it('renders previous placements', () => {
        const application: NonNullable<Cas1ServiceResult['cas1Application']> = {
          ...cas1Application,
          placementHistory: [
            {
              dateApplied: '2026-06-01',
              requestForPlacement: {
                status: 'REQUEST_WITHDRAWN',
                withdrawalDate: '2026-06-20',
                withdrawalReason: 'CHANGE_IN_CIRCUMSTANCES',
              },
            },
            {
              dateApplied: '2026-05-01',
              placement: {
                status: 'DEPARTED',
                actualArrivalDate: '2026-05-20',
                actualDepartureDate: '2026-06-20',
              },
            },
            {
              dateApplied: '2026-05-01',
              requestForPlacement: {
                expectedArrivalDate: '2026-05-21',
              },
              placement: {
                status: 'NOT_ARRIVED',
              },
            },
            {
              dateApplied: '2026-04-01',
              placement: {
                status: 'CANCELLED',
                cancellationReason: 'No longer needed',
              },
            },
            {
              dateApplied: '2026-03-30',
              requestForPlacement: {
                status: 'REQUEST_REJECTED',
                rejectionReason: 'Placement unsuitable',
              },
            },
          ],
        }

        const { content } = cas1StatusCard({
          serviceResult,
          cas1Application: application,
        })

        expect(JSON.stringify(content)).toContain('5 previous placements on this application')
        expect(content).toMatchSnapshot()
      })

      it('does not render placement history when empty', () => {
        const { content } = cas1StatusCard({
          serviceResult,
          cas1Application,
        })

        expect(content).toBeUndefined()
      })
    })
  })
})

describe('eligibilityToEligibilityCards', () => {
  const crn = 'X123456'

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-01-21'))
    config.flags.cas2Enabled = false
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

  describe('when the cas2 flag is enabled', () => {
    beforeEach(() => {
      config.flags.cas2Enabled = true
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('includes the CAS2 card', () => {
      const eligibility = eligibilityFactory.build({ crn })

      const cards = eligibilityToEligibilityCards(eligibility, crn)

      expect(cards).toHaveLength(5)
      expect(cards[3].heading).toContain('Short-term accommodation (CAS2)')
    })
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
          serviceStatus: 'NOT_SUBMITTED',
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
