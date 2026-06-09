import { eligibilityStatusCard, eligibilityToEligibilityCards } from './eligibility'
import {
  crsServiceResultFactory,
  crsSubmissionFactory,
  eligibilityFactory,
  serviceResultFactory,
} from '../testutils/factories'

describe('eligibility utilities', () => {
  describe('eligibilityStatusCard', () => {
    it.each([
      [['Start referral', 'Notes'], 'NOT_STARTED' as const],
      [['Notes'], 'NOT_ELIGIBLE' as const],
      [['Notes'], 'UPCOMING' as const],
      [[], 'CONFIRMED' as const],
    ])('renders links %s for status %s', (links, status) => {
      const serviceResult = serviceResultFactory.build({ serviceStatus: status })

      const card = eligibilityStatusCard('Foo', serviceResult)

      for (const link of links) {
        expect(card.links).toEqual(expect.arrayContaining([{ text: link, href: expect.any(String) }]))
      }
    })

    it('renders a hint if the status is not eligible', () => {
      const serviceResult = serviceResultFactory.build({ serviceStatus: 'NOT_ELIGIBLE' })

      const card = eligibilityStatusCard('Card title', serviceResult)

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
      cas1: { serviceResult: serviceResultFactory.build({ serviceStatus: 'NOT_STARTED' }) },
      cas3: { serviceResult: serviceResultFactory.build({ serviceStatus: 'CONFIRMED' }) },
      dtr: {
        serviceResult: serviceResultFactory.build({ serviceStatus: 'ACCEPTED' }),
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
      crs: crsServiceResultFactory.submitted().build({
        commissionedRehabilitativeServices: crsSubmissionFactory.build({
          submissionDate: '2025-11-30',
        }),
      }),
    })

    const cards = eligibilityToEligibilityCards(eligibility, crn)

    expect(cards).toMatchSnapshot()
  })
})
