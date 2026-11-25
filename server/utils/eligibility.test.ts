import {
  Cas1ServiceResultWrapper,
  Cas3ServiceResultWrapper,
  Cas2ServiceResultWrapper,
  Cas2SubmittedApplicationSummaryDto,
  Cas2ApplicationDto,
  ServiceResultV2,
} from '@sas/api'
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

const cas1Application: NonNullable<Cas1ServiceResultWrapper['cas1Application']> = {
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
    expectedDepartureDate: '2026-10-27',
    cancellationReason: 'Over capacity',
  },
}

const cas3Application: NonNullable<Cas3ServiceResultWrapper['cas3Application']> = {
  id: 'cas3-application-id',
  createdAt: '2026-06-01T09:00:00.000Z',
  applicationStatus: 'SUBMITTED',
  uiUrl: 'https://example.com/referral',
  applicationSubmittedDate: '2026-06-02',
  createdBy: { name: 'Joe Bloggs', username: 'joe.bloggs', staffCode: 'STAFF1' },
  bookingProvisionalOfferSentDate: '2026-06-15',
  premises: {
    addressLine1: '1 Test Street',
    town: 'Leeds',
    postcode: 'LS1 1AA',
    startDate: '2026-09-01',
    endDate: '2026-10-27',
  },
  cancellation: { cancellationReason: 'No longer needed' },
  previousBookings: [],
}

const cas2Application: NonNullable<Cas2ServiceResultWrapper['cas2Application']> = {
  uiUrl: 'https://example.com/application',
  id: 'cas2-application-id',
  createdAt: '2026-06-01',
  createdBy: { name: 'Joe Bloggs', username: 'joe.bloggs', userType: 'PROBATION_PRACTITIONER' },
  submittedApplication: {
    submittedAt: '2026-06-02',
    offerDeclinedReason: 'Offer unsuitable',
    cancelledReason: 'Application cancelled',
  },
}

describe('linksForService', () => {
  const linkBuilders: Record<'cas1' | 'cas2' | 'cas3', (serviceResult?: ServiceResultV2) => Link[]> = {
    cas1: linksForCas1Status,
    cas2: linksForCas2Status,
    cas3: linksForCas3Status,
  }

  const testCases = [
    { service: 'cas1', status: 'CAS1_NOT_STARTED', expected: ['Start application'] },
    { service: 'cas1', status: 'CAS1_NOT_SUBMITTED', expected: ['Continue application'] },
    { service: 'cas1', status: 'CAS1_APPLICATION_REJECTED', expected: ['Start new application'] },
    { service: 'cas1', status: 'CAS1_SUBMITTED', expected: ['View application'] },
    { service: 'cas1', status: 'CAS1_INFO_REQUESTED', expected: ['View application'] },
    { service: 'cas1', status: 'CAS1_PLACEMENT_BOOKED', expected: ['View application'] },
    { service: 'cas1', status: 'CAS1_PLACEMENT_REQUEST_SUBMITTED', expected: ['View application'] },
    { service: 'cas1', status: 'CAS1_NOT_ARRIVED', expected: ['Create new placement request'] },
    { service: 'cas1', status: 'CAS1_PLACEMENT_CANCELLED', expected: ['Create new placement request'] },
    { service: 'cas1', status: 'CAS1_PLACEMENT_REQUEST_REJECTED', expected: ['Create new placement request'] },
    { service: 'cas1', status: 'CAS1_PLACEMENT_REQUEST_WITHDRAWN', expected: ['Create new placement request'] },
    { service: 'cas1', status: 'CAS1_PLACEMENT_REQUEST_NOT_STARTED', expected: ['Create placement request'] },
    { service: 'cas1', status: 'CAS1_NOT_ELIGIBLE', expected: undefined },
    { service: 'cas1', status: 'CAS1_UPCOMING', expected: undefined },
    { service: 'cas2', status: 'CAS2_NOT_STARTED', expected: ['Start application'] },
    { service: 'cas2', status: 'CAS2_NOT_SUBMITTED', expected: ['Continue application'] },
    { service: 'cas2', status: 'CAS2_MORE_INFORMATION_NEEDED', expected: ['Continue application'] },
    { service: 'cas2', status: 'CAS2_SUBMITTED', expected: ['View application'] },
    { service: 'cas2', status: 'CAS2_AWAITING_DECISION', expected: ['View application'] },
    { service: 'cas2', status: 'CAS2_ON_WAITING_LIST', expected: ['View application'] },
    { service: 'cas2', status: 'CAS2_PLACE_OFFERED', expected: ['View application'] },
    { service: 'cas2', status: 'CAS2_OFFER_ACCEPTED', expected: ['View application'] },
    { service: 'cas2', status: 'CAS2_AWAITING_ARRIVAL', expected: ['View application'] },
    { service: 'cas2', status: 'CAS2_ARRIVED', expected: ['View application'] },
    { service: 'cas2', status: 'CAS2_OFFER_DECLINED_OR_WITHDRAWN', expected: ['Start new application'] },
    { service: 'cas2', status: 'CAS2_CANCELLED', expected: ['Start new application'] },
    { service: 'cas2', status: 'CAS2_WITHDRAWN', expected: ['Start new application'] },
    { service: 'cas2', status: 'CAS2_NOT_ELIGIBLE', expected: undefined },
    { service: 'cas2', status: 'CAS2_UPCOMING', expected: undefined },
    { service: 'cas3', status: 'CAS3_NOT_STARTED', expected: ['Start referral'] },
    { service: 'cas3', status: 'CAS3_SUBMITTED', expected: ['View referral'] },
    { service: 'cas3', status: 'CAS3_NOT_SUBMITTED', expected: ['Continue referral'] },
    { service: 'cas3', status: 'CAS3_ARRIVED', expected: ['View referral'] },
    { service: 'cas3', status: 'CAS3_BEDSPACE_OFFERED', expected: ['View referral'] },
    { service: 'cas3', status: 'CAS3_BOOKING_CONFIRMED', expected: ['View referral'] },
    { service: 'cas3', status: 'CAS3_BOOKING_CANCELLED', expected: ['View referral'] },
    { service: 'cas3', status: 'CAS3_REJECTED', expected: ['Start new referral'] },
    { service: 'cas3', status: 'CAS3_CANNOT_START_YET_SUBMIT_DTR', expected: undefined },
    { service: 'cas3', status: 'CAS3_NOT_ELIGIBLE', expected: undefined },
    { service: 'cas3', status: 'CAS3_UPCOMING', expected: undefined },
  ]

  it.each(testCases)(
    'returns correct links for $service and status $status',
    ({
      service,
      status,
      expected,
    }: {
      service: 'cas1' | 'cas2' | 'cas3'
      status: ServiceResultV2['serviceStatus']
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
  let originalManualArrivalFlag: boolean

  beforeEach(() => {
    originalManualArrivalFlag = config.flags.cas2ManualArrivalEnabled
    config.flags.cas2ManualArrivalEnabled = false
  })

  afterEach(() => {
    config.flags.cas2ManualArrivalEnabled = originalManualArrivalFlag
  })

  // See: https://hmpps-single-accommodation-service-prototype-main.apps.live.cloud-platform.service.justice.gov.uk/10-0/_statuses?r=t
  const testCases: Record<'cas1' | 'cas2' | 'cas3', { title: string; result: Partial<ServiceResultV2> }[]> = {
    cas1: [
      {
        title: 'NOT_ELIGIBLE',
        result: { serviceStatus: 'CAS1_NOT_ELIGIBLE', failureReasons: ['MALE_NOT_HIGH_RISK_TIER'] },
      },
      {
        title: 'UPCOMING',
        result: {
          serviceStatus: 'CAS1_UPCOMING',
          actionStartDate: '2026-11-08',
        },
      },
      {
        title: 'NOT_STARTED',
        result: { serviceStatus: 'CAS1_NOT_STARTED', url: 'https://example.com/start' },
      },
      {
        title: 'SUBMITTED',
        result: { serviceStatus: 'CAS1_SUBMITTED', url: 'https://example.com/view' },
      },
      {
        title: 'NOT_SUBMITTED',
        result: { serviceStatus: 'CAS1_NOT_SUBMITTED', url: 'https://example.com/continue' },
      },
      {
        title: 'INFO_REQUESTED',
        result: { serviceStatus: 'CAS1_INFO_REQUESTED', url: 'https://example.com/view' },
      },
      {
        title: 'APPLICATION_REJECTED',
        result: { serviceStatus: 'CAS1_APPLICATION_REJECTED', url: 'https://example.com/start' },
      },
      {
        title: 'PLACEMENT_BOOKED',
        result: { serviceStatus: 'CAS1_PLACEMENT_BOOKED', url: 'https://example.com/view' },
      },
      {
        title: 'NOT_ARRIVED',
        result: { serviceStatus: 'CAS1_NOT_ARRIVED', url: 'https://example.com/create-new-placement-request' },
      },
      {
        title: 'PLACEMENT_CANCELLED',
        result: { serviceStatus: 'CAS1_PLACEMENT_CANCELLED', url: 'https://example.com/create-new-placement-request' },
      },
      {
        title: 'PLACEMENT_REQUEST_NOT_STARTED',
        result: {
          serviceStatus: 'CAS1_PLACEMENT_REQUEST_NOT_STARTED',
          url: 'https://example.com/create-placement-request',
        },
      },
      {
        title: 'PLACEMENT_REQUEST_SUBMITTED',
        result: { serviceStatus: 'CAS1_PLACEMENT_REQUEST_SUBMITTED', url: 'https://example.com/view' },
      },
      {
        title: 'PLACEMENT_REQUEST_REJECTED',
        result: {
          serviceStatus: 'CAS1_PLACEMENT_REQUEST_REJECTED',
          url: 'https://example.com/create-new-placement-request',
        },
      },
      {
        title: 'PLACEMENT_REQUEST_WITHDRAWN',
        result: {
          serviceStatus: 'CAS1_PLACEMENT_REQUEST_WITHDRAWN',
          url: 'https://example.com/create-new-placement-request',
        },
      },
    ],
    cas2: [
      {
        title: 'NOT_ELIGIBLE',
        result: { serviceStatus: 'CAS2_NOT_ELIGIBLE' },
      },
      {
        title: 'NOT_ELIGIBLE tier not correct',
        result: { serviceStatus: 'CAS2_NOT_ELIGIBLE', failureReasons: ['INVALID_TIER'] },
      },
      {
        title: 'NOT_ELIGIBLE sexual offence history',
        result: { serviceStatus: 'CAS2_NOT_ELIGIBLE', failureReasons: ['SEXUAL_OFFENCE_REGISTRATIONS_PRESENT'] },
      },
      {
        title: 'NOT_ELIGIBLE under 18',
        result: { serviceStatus: 'CAS2_NOT_ELIGIBLE', failureReasons: ['UNDER_18'] },
      },
      {
        title: 'NOT_ELIGIBLE currently in CAS3',
        result: { serviceStatus: 'CAS2_NOT_ELIGIBLE', failureReasons: ['IN_CAS3_ACCOMMODATION'] },
      },
      {
        title: 'NOT_ELIGIBLE no conditional release date',
        result: { serviceStatus: 'CAS2_NOT_ELIGIBLE', failureReasons: ['IN_PRISON_NO_RELEASE_DATE'] },
      },
      {
        title: 'NOT_ELIGIBLE currently in CAS2',
        result: { serviceStatus: 'CAS2_NOT_ELIGIBLE', failureReasons: ['IN_CAS2_ACCOMMODATION'] },
      },
      {
        title: 'NOT_ELIGIBLE currently in community',
        result: { serviceStatus: 'CAS2_NOT_ELIGIBLE', failureReasons: ['IN_COMMUNITY'] },
      },
      {
        title: 'NOT_ELIGIBLE multiple failure reasons',
        result: {
          serviceStatus: 'CAS2_NOT_ELIGIBLE',
          failureReasons: ['INVALID_TIER', 'SEXUAL_OFFENCE_REGISTRATIONS_PRESENT'],
        },
      },
      {
        title: 'NOT_STARTED',
        result: { serviceStatus: 'CAS2_NOT_STARTED', url: 'https://example.com/start' },
      },
      {
        title: 'NOT_SUBMITTED',
        result: { serviceStatus: 'CAS2_NOT_SUBMITTED', url: 'https://example.com/continue' },
      },
      {
        title: 'MORE_INFORMATION_NEEDED',
        result: { serviceStatus: 'CAS2_MORE_INFORMATION_NEEDED', url: 'https://example.com/continue' },
      },
      {
        title: 'SUBMITTED',
        result: { serviceStatus: 'CAS2_SUBMITTED', url: 'https://example.com/view' },
      },
      {
        title: 'AWAITING_DECISION',
        result: { serviceStatus: 'CAS2_AWAITING_DECISION', url: 'https://example.com/view' },
      },
      {
        title: 'ON_WAITING_LIST',
        result: { serviceStatus: 'CAS2_ON_WAITING_LIST', url: 'https://example.com/view' },
      },
      {
        title: 'PLACE_OFFERED',
        result: { serviceStatus: 'CAS2_PLACE_OFFERED', url: 'https://example.com/view' },
      },
      {
        title: 'OFFER_ACCEPTED',
        result: { serviceStatus: 'CAS2_OFFER_ACCEPTED', url: 'https://example.com/view' },
      },
      {
        title: 'AWAITING_ARRIVAL',
        result: { serviceStatus: 'CAS2_AWAITING_ARRIVAL', url: 'https://example.com/view' },
      },
      {
        title: 'OFFER_DECLINED_OR_WITHDRAWN',
        result: { serviceStatus: 'CAS2_OFFER_DECLINED_OR_WITHDRAWN', url: 'https://example.com/start-new' },
      },
      {
        title: 'CANCELLED',
        result: { serviceStatus: 'CAS2_CANCELLED', url: 'https://example.com/start-new' },
      },
      {
        title: 'WITHDRAWN',
        result: { serviceStatus: 'CAS2_WITHDRAWN', url: 'https://example.com/start-new' },
      },
    ],
    cas3: [
      {
        title: 'NOT_ELIGIBLE',
        result: { serviceStatus: 'CAS3_NOT_ELIGIBLE' },
      },
      {
        title: 'NOT_ELIGIBLE, incorrect current accommodation',
        result: { serviceStatus: 'CAS3_NOT_ELIGIBLE', failureReasons: ['INVALID_CURRENT_ACCOMMODATION_TYPE'] },
      },
      {
        title: 'CANNOT_START_YET, DTR needed',
        result: { serviceStatus: 'CAS3_CANNOT_START_YET_SUBMIT_DTR' },
      },
      {
        title: 'CANNOT_START_YET, CRS needed',
        result: { serviceStatus: 'CAS3_CANNOT_START_YET_SUBMIT_CRS' },
      },
      {
        title: 'CANNOT_START_YET, both DTR and CRS needed',
        result: { serviceStatus: 'CAS3_CANNOT_START_YET_SUBMIT_DTR_CRS' },
      },
      {
        title: 'CANNOT_START_YET, CRS accommodation needed',
        result: { serviceStatus: 'CAS3_CANNOT_START_YET_SUBMIT_CRS_ACCOMMODATION' },
      },
      {
        title: 'CANNOT_START_YET, both DTR and CRS accommodation needed',
        result: {
          serviceStatus: 'CAS3_CANNOT_START_YET_SUBMIT_DTR_CRS_ACCOMMODATION',
        },
      },
      {
        title: 'UPCOMING',
        result: {
          serviceStatus: 'CAS3_UPCOMING',
          actionStartDate: '2026-12-15',
        },
      },
      {
        title: 'NOT_STARTED',
        result: { serviceStatus: 'CAS3_NOT_STARTED', url: 'https://example.com/start' },
      },
      {
        title: 'SUBMITTED',
        result: { serviceStatus: 'CAS3_SUBMITTED', url: 'https://example.com/view' },
      },
      {
        title: 'ARRIVED',
        result: { serviceStatus: 'CAS3_ARRIVED', url: 'https://example.com/view' },
      },
      {
        title: 'REJECTED',
        result: { serviceStatus: 'CAS3_REJECTED', url: 'https://example.com/start-new' },
      },
      {
        title: 'BEDSPACE_OFFERED',
        result: { serviceStatus: 'CAS3_BEDSPACE_OFFERED', url: 'https://example.com/view' },
      },
      {
        title: 'BOOKING_CONFIRMED',
        result: { serviceStatus: 'CAS3_BOOKING_CONFIRMED', url: 'https://example.com/view' },
      },
      {
        title: 'BOOKING_CANCELLED',
        result: { serviceStatus: 'CAS3_BOOKING_CANCELLED', url: 'https://example.com/view' },
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
    const cardBuilders: Record<'cas1' | 'cas2' | 'cas3', (result: ServiceResultV2) => StatusCard> = {
      cas1: result => cas1StatusCard({ serviceResult: result, cas1Application, actionPosition: -1 }),
      cas2: result => cas2StatusCard({ serviceResult: result, cas2Application, actionPosition: -1 }, 'X123456'),
      cas3: result => cas3StatusCard({ serviceResult: result, actionPosition: -1 }),
    }

    it.each(testCases[service])('renders a $title status card', ({ result }) => {
      const serviceResult = serviceResultFactory.build({
        serviceStatus: 'CAS1_NOT_STARTED',
        actionStartDate: undefined,
        failureReasons: [],
        url: undefined,
        ...result,
      })

      expect(cardBuilders[service](serviceResult)).toMatchSnapshot()
    })

    it.each([
      ['CAS1_UPCOMING', cas1StatusCard],
      [
        'CAS2_UPCOMING',
        (result: { serviceResult: ServiceResultV2; actionPosition: number }) => cas2StatusCard(result, 'X123456'),
      ],
      ['CAS3_UPCOMING', cas3StatusCard],
    ] as const)('shows the start date for %s', (serviceStatus, buildCard) => {
      const serviceResult = serviceResultFactory.build({
        serviceStatus,
        actionStartDate: '2026-11-08',
      })

      expect(buildCard({ serviceResult, actionPosition: -1 })?.hint).toBe(
        'Start referral from 8 November 2026 (in 100 days).',
      )
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
    const detailStatuses: ServiceResultV2['serviceStatus'][] = [
      'CAS1_NOT_SUBMITTED',
      'CAS1_SUBMITTED',
      'CAS1_INFO_REQUESTED',
      'CAS1_APPLICATION_REJECTED',
      'CAS1_PLACEMENT_BOOKED',
      'CAS1_ARRIVED',
      'CAS1_NOT_ARRIVED',
      'CAS1_PLACEMENT_CANCELLED',
      'CAS1_PLACEMENT_REQUEST_NOT_STARTED',
      'CAS1_PLACEMENT_REQUEST_SUBMITTED',
      'CAS1_PLACEMENT_REQUEST_REJECTED',
      'CAS1_PLACEMENT_REQUEST_WITHDRAWN',
    ]

    it.each(detailStatuses)('renders detail rows for a %s status', status => {
      const serviceResult = serviceResultFactory.build({ serviceStatus: status })

      expect(cas1StatusCard({ serviceResult, cas1Application, actionPosition: -1 }).details).toMatchSnapshot()
    })

    it.each([
      [0, '0 days'],
      [1, '1 day'],
      [3, '3 days'],
      [7, '1 week'],
      [8, '1 week, 1 day'],
      [10, '1 week, 3 days'],
      [11, '1 week, 4 days'],
      [14, '2 weeks'],
      [15, '2 weeks, 1 day'],
    ])('formats a %s-day placement duration as %s', (durationDays, expectedDuration) => {
      const serviceResult = serviceResultFactory.build({ serviceStatus: 'CAS1_PLACEMENT_BOOKED' })
      const application = {
        ...cas1Application,
        requestForPlacement: { ...cas1Application.requestForPlacement, durationDays },
      }

      expect(cas1StatusCard({ serviceResult, cas1Application: application, actionPosition: -1 }).details).toEqual(
        expect.arrayContaining([
          {
            key: { text: 'Duration' },
            value: { text: expectedDuration },
          },
        ]),
      )
    })
  })

  describe('content', () => {
    describe('placement history', () => {
      const statuses = [
        'CAS1_PLACEMENT_REQUEST_WITHDRAWN',
        'CAS1_PLACEMENT_BOOKED',
        'CAS1_PLACEMENT_REQUEST_SUBMITTED',
        'CAS1_PLACEMENT_REQUEST_REJECTED',
        'CAS1_PLACEMENT_REQUEST_NOT_STARTED',
        'CAS1_PLACEMENT_CANCELLED',
        'CAS1_NOT_ARRIVED',
        'CAS1_ARRIVED',
      ] as const
      const application: NonNullable<Cas1ServiceResultWrapper['cas1Application']> = {
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
            requestForPlacement: { expectedArrivalDate: '2026-05-21' },
            placement: { status: 'NOT_ARRIVED' },
          },
          {
            dateApplied: '2026-04-01',
            placement: { status: 'CANCELLED', cancellationReason: 'No longer needed' },
          },
          {
            dateApplied: '2026-03-30',
            requestForPlacement: {
              status: 'REQUEST_REJECTED',
              submittedAt: '2026-03-30',
              rejectionReason: 'Placement unsuitable',
            },
          },
          {
            dateApplied: '2026-04-20',
            requestForPlacement: {
              status: 'REQUEST_WITHDRAWN',
              withdrawalDate: '2026-04-20',
              withdrawalReason: 'DUPLICATE_PLACEMENT_REQUEST',
            },
          },
          {
            dateApplied: '2026-03-20',
            placement: { status: 'ARRIVED', actualArrivalDate: '2026-03-25' },
          },
          {
            dateApplied: '2026-03-10',
            placement: {
              status: 'UPCOMING',
              premises: { addressLine1: '2 Test Street', postcode: 'LS1 1AA', startDate: '2026-04-01' },
            },
          },
          {
            dateApplied: '2026-03-01',
            requestForPlacement: { status: 'REQUEST_SUBMITTED', submittedAt: '2026-03-02' },
          },
          {
            dateApplied: '2026-02-20',
            requestForPlacement: { status: 'AWAITING_MATCH', submittedAt: '2026-02-20' },
          },
        ],
      }

      const contentFor = (serviceStatus: ServiceResultV2['serviceStatus']) =>
        cas1StatusCard({
          serviceResult: serviceResultFactory.build({ serviceStatus }),
          actionPosition: -1,
          cas1Application: application,
        }).content

      it.each(statuses)('shows previous placements on the %s card', serviceStatus => {
        expect(JSON.stringify(contentFor(serviceStatus))).toContain('10 previous placements on this application')
      })

      it('renders previous placements', () => {
        expect(contentFor('CAS1_PLACEMENT_REQUEST_NOT_STARTED')).toMatchSnapshot()
      })

      it('does not render placement history when empty', () => {
        const { content } = cas1StatusCard({
          serviceResult: serviceResultFactory.build({ serviceStatus: 'CAS1_PLACEMENT_REQUEST_NOT_STARTED' }),
          actionPosition: -1,
          cas1Application,
        })

        expect(content).toBeUndefined()
      })
    })
  })
})

describe('cas3 status card', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-01'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('details', () => {
    const detailStatuses: ServiceResultV2['serviceStatus'][] = [
      'CAS3_NOT_STARTED',
      'CAS3_NOT_SUBMITTED',
      'CAS3_SUBMITTED',
      'CAS3_REJECTED',
      'CAS3_BEDSPACE_OFFERED',
      'CAS3_BOOKING_CONFIRMED',
      'CAS3_BOOKING_CANCELLED',
      'CAS3_ARRIVED',
    ]

    it.each(detailStatuses)('renders detail rows for a %s status', status => {
      const serviceResult = serviceResultFactory.build({ serviceStatus: status })

      expect(cas3StatusCard({ serviceResult, cas3Application, actionPosition: -1 }).details).toMatchSnapshot()
    })

    it('includes booking duration in weeks for a confirmed booking', () => {
      const serviceResult = serviceResultFactory.build({ serviceStatus: 'CAS3_BOOKING_CONFIRMED' })

      expect(cas3StatusCard({ serviceResult, cas3Application, actionPosition: -1 }).details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            key: expect.objectContaining({ text: 'Booking dates' }),
            value: expect.objectContaining({ text: '1 September 2026 to 27 October 2026 (8 weeks)' }),
          }),
        ]),
      )
    })
  })

  describe('content', () => {
    it.each([
      ['CAS3_CANNOT_START_YET_SUBMIT_CRS', ['You need to submit a CRS referral before you can make a CAS3 referral.']],
      [
        'CAS3_CANNOT_START_YET_SUBMIT_DTR',
        ['You need to add DTR referral details before you can make a CAS3 referral.'],
      ],
      ['CAS3_CANNOT_START_YET_SUBMIT_DTR_CRS', ['Add DTR referral details', 'Submit a CRS referral']],
      [
        'CAS3_CANNOT_START_YET_SUBMIT_CRS_ACCOMMODATION',
        ['You need to submit a CRS accommodation referral before you can make a CAS3 referral.'],
      ],
      [
        'CAS3_CANNOT_START_YET_SUBMIT_DTR_CRS_ACCOMMODATION',
        ['Add DTR referral details', 'Submit a CRS accommodation referral'],
      ],
    ] as [ServiceResultV2['serviceStatus'], string[]][])('renders requirements for %s', (serviceStatus, messages) => {
      const serviceResult: ServiceResultV2 = { serviceStatus, failureReasons: [] }
      const { content } = cas3StatusCard({ serviceResult, actionPosition: -1 })

      messages.forEach(message => expect(JSON.stringify(content)).toContain(message))
    })

    const serviceResult = serviceResultFactory.build({
      serviceStatus: 'CAS3_BEDSPACE_OFFERED',
    })

    describe('previous bookings', () => {
      it('renders previous bookings', () => {
        const application: NonNullable<Cas3ServiceResultWrapper['cas3Application']> = {
          ...cas3Application,
          previousBookings: [
            {
              bookingStatus: 'CANCELLED',
              cancellation: {
                cancellationDate: '2026-06-20',
                cancellationReason: 'No longer needed',
              },
            },
            {
              bookingStatus: 'CANCELLED',
              cancellation: {
                cancellationReason: 'No longer needed',
              },
            },
          ],
        }

        const { content } = cas3StatusCard({
          serviceResult,
          actionPosition: -1,
          cas3Application: application,
        })

        expect(JSON.stringify(content)).toContain('2 previous bookings on this application')
        expect(content).toMatchSnapshot()
      })

      it('does not render previous bookings when empty', () => {
        const { content } = cas3StatusCard({
          serviceResult,
          actionPosition: -1,
          cas3Application,
        })

        expect(content).toBeUndefined()
      })
    })
  })
})

describe('cas2 status card', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-01'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('details', () => {
    const detailStatuses: ServiceResultV2['serviceStatus'][] = [
      'CAS2_NOT_SUBMITTED',
      'CAS2_MORE_INFORMATION_NEEDED',
      'CAS2_SUBMITTED',
      'CAS2_AWAITING_DECISION',
      'CAS2_ON_WAITING_LIST',
      'CAS2_PLACE_OFFERED',
      'CAS2_OFFER_ACCEPTED',
      'CAS2_AWAITING_ARRIVAL',
      'CAS2_OFFER_DECLINED_OR_WITHDRAWN',
      'CAS2_CANCELLED',
      'CAS2_WITHDRAWN',
    ]

    it.each(detailStatuses)('renders detail rows for a %s status', status => {
      const serviceResult = serviceResultFactory.build({ serviceStatus: status })

      expect(
        cas2StatusCard({ serviceResult, cas2Application, actionPosition: -1 }, 'X123456').details,
      ).toMatchSnapshot()
    })

    it('renders details for an ARRIVED status', () => {
      const serviceResult = serviceResultFactory.build({ serviceStatus: 'CAS2_ARRIVED' })
      const submittedApplication: Cas2SubmittedApplicationSummaryDto = {
        latestAssessmentStatus: 'AWAITING_ARRIVAL',
        submittedAt: '2026-11-01',
        markedAsArrived: {
          dateTime: '2026-11-02T12:34:56',
          arrivedByName: 'Bob Smith',
          arrivedByUsername: 'BobSmith',
        },
      }

      const application: Cas2ApplicationDto = { ...cas2Application, submittedApplication }

      expect(
        cas2StatusCard({ serviceResult, cas2Application: application, actionPosition: -1 }, 'X123456').details,
      ).toMatchSnapshot()
    })
  })

  describe('content', () => {
    it('renders additional content for NOT_ELIGIBLE status', () => {
      const serviceResult: ServiceResultV2 = {
        serviceStatus: 'CAS2_NOT_ELIGIBLE',
        failureReasons: ['INVALID_TIER'],
      }

      expect(cas2StatusCard({ serviceResult, actionPosition: -1 }, 'X123456').content).toMatchSnapshot()
    })

    it('does not render content for other statuses', () => {
      const serviceResult: ServiceResultV2 = { serviceStatus: 'CAS2_SUBMITTED', failureReasons: ['INVALID_TIER'] }

      expect(cas2StatusCard({ serviceResult, actionPosition: -1 }, 'X123456').content).toEqual([])
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

  it.each([
    ['CAS1_NOT_ELIGIBLE', ['NOT_IN_PRISON_OR_CAS1_ACCOMMODATION'], true],
    ['CAS1_NOT_ELIGIBLE', ['MALE_NOT_HIGH_RISK_TIER'], false],
    ['CAS1_NOT_STARTED', ['NOT_IN_PRISON_OR_CAS1_ACCOMMODATION'], false],
  ] as [ServiceResultV2['serviceStatus'], ServiceResultV2['failureReasons'], boolean][])(
    'hides CAS1 for %s and failure reasons %s: %s',
    (serviceStatus, failureReasons, hidden) => {
      const card = cas1StatusCard({ serviceResult: { serviceStatus, failureReasons }, actionPosition: -1 })

      expect(card === undefined).toBe(hidden)
    },
  )

  it('returns eligibility cards for each service', () => {
    const eligibility = eligibilityFactory.build({ crn })

    const cards = eligibilityToEligibilityCards(eligibility, crn)

    expect(cards).toHaveLength(4)
    expect(cards[0].heading).toContain('Duty to Refer (DTR)')
    expect(cards[1].heading).toContain('Commissioned Rehabilitative Services (CRS)')
    expect(cards[2].heading).toContain('Approved premises (CAS1)')
    expect(cards[3].heading).toContain('CAS3 (transitional accommodation)')
  })

  it('hides the CAS1 card when the person is not in prison or CAS1 accommodation', () => {
    const eligibility = eligibilityFactory.build({
      crn,
      cas1: {
        serviceResult: serviceResultFactory.build({
          serviceStatus: 'CAS1_NOT_ELIGIBLE',
          failureReasons: ['NOT_IN_PRISON_OR_CAS1_ACCOMMODATION'],
        }),
      },
    })

    const cards = eligibilityToEligibilityCards(eligibility, crn)

    expect(cards.map(card => card.heading)).not.toContain('Approved premises (CAS1)')
  })

  it('shows the CAS1 card as inactive when ineligible for other reasons', () => {
    const eligibility = eligibilityFactory.build({
      crn,
      cas1: {
        serviceResult: serviceResultFactory.build({
          serviceStatus: 'CAS1_NOT_ELIGIBLE',
          failureReasons: ['MALE_NOT_HIGH_RISK_TIER'],
        }),
      },
    })

    const cards = eligibilityToEligibilityCards(eligibility, crn)

    expect(cards.find(card => card.heading === 'Approved premises (CAS1)')?.inactive).toBe(true)
  })

  describe('when the cas2 flag is enabled', () => {
    let previousManualArrivalFlag: boolean

    beforeEach(() => {
      config.flags.cas2Enabled = true
      previousManualArrivalFlag = config.flags.cas2ManualArrivalEnabled
      config.flags.cas2ManualArrivalEnabled = true
    })

    afterEach(() => {
      config.flags.cas2ManualArrivalEnabled = previousManualArrivalFlag
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

    it('links to mark the actual CAS2 application as arrived', () => {
      const eligibility = eligibilityFactory.build({
        crn,
        cas2: {
          serviceResult: serviceResultFactory.build({
            serviceStatus: 'CAS2_AWAITING_ARRIVAL',
            url: 'https://cas2/view',
          }),
          cas2Application,
        },
      })

      const card = eligibilityToEligibilityCards(eligibility, crn).find(
        eligibilityCard => eligibilityCard.heading === 'Short-term accommodation (CAS2)',
      )

      expect(card?.links).toContainEqual({
        text: 'Mark as arrived',
        href: '/cases/X123456/applications/cas2-application-id/arrival',
        external: false,
      })
    })
  })

  it('returns an array of eligibility card objects', () => {
    const eligibility = eligibilityFactory.build({
      crn,
      cas1: {
        serviceResult: serviceResultFactory.build({
          serviceStatus: 'CAS1_NOT_STARTED',
          url: 'https://example.com/start-application',
        }),
      },
      cas3: {
        serviceResult: serviceResultFactory.build({
          serviceStatus: 'CAS3_NOT_SUBMITTED',
          url: 'https://example.com/view-referral',
        }),
      },
      dtr: {
        serviceResult: serviceResultFactory.build({
          serviceStatus: 'DTR_ACCEPTED',
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
          serviceStatus: 'CRS_SUBMITTED',
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
