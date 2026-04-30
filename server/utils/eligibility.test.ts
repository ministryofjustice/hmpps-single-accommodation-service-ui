import { eligibilityStatusCard, eligibilityToEligibilityCards } from './eligibility'
import { eligibilityFactory, serviceResultFactory } from '../testutils/factories'

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
  })
})

describe('eligibilityToEligibilityCards', () => {
  const crn = 'X123456'

  it('returns eligibility cards for each service', () => {
    const eligibility = eligibilityFactory.build({ crn })

    const cards = eligibilityToEligibilityCards(eligibility, crn)

    expect(cards).toHaveLength(3)
    expect(cards[0].heading).toContain('Duty to Refer (DTR)')
    expect(cards[1].heading).toContain('Approved premises (CAS1)')
    expect(cards[2].heading).toContain('CAS3 (transitional accommodation)')
  })

  it('returns an array of eligibility card objects', () => {
    const eligibility = eligibilityFactory.build({
      crn,
      cas1: { serviceResult: serviceResultFactory.build({ serviceStatus: 'NOT_STARTED' }) },
      cas3: { serviceResult: serviceResultFactory.build({ serviceStatus: 'CONFIRMED' }) },
      dtr: { serviceResult: serviceResultFactory.build({ serviceStatus: 'ACCEPTED' }), submission: { id: 'some-id' } },
    })

    const cards = eligibilityToEligibilityCards(eligibility, crn)

    expect(cards).toMatchSnapshot()
  })
})
