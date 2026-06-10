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
  describe.each(['cas1', 'cas3'] as const)('for %s', service => {
    it('renders a NOT_STARTED status card', () => {
      const serviceResult = serviceResultFactory.build({
        serviceStatus: 'NOT_STARTED',
        url: 'https://example.com/start',
      })

      expect(eligibilityStatusCard(service, serviceResult)).toMatchSnapshot()
    })

    it('renders a hint if the status is not eligible', () => {
      const serviceResult = serviceResultFactory.build({ serviceStatus: 'NOT_ELIGIBLE' })

      const card = eligibilityStatusCard(service, serviceResult)

      expect(card.hint).toEqual('This could be because of risk levels or suitability for a move on at this time.')
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
