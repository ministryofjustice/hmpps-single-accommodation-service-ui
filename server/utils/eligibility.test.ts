import { eligibilityStatusCard, eligibilityToEligibilityCards } from './eligibility'
import { eligibilityFactory, ruleActionFactory, serviceResultFactory } from '../testutils/factories'

describe('eligibility utilities', () => {
  describe('eligibilityStatusCard', () => {
    it.each([
      [['Start referral', 'Notes'], 'NOT_STARTED' as const],
      [['Notes'], 'NOT_ELIGIBLE' as const],
      [['Notes'], 'UPCOMING' as const],
      [['Referral and notes'], 'ARRIVED' as const],
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
  it('returns eligibility cards for each service', () => {
    const eligibility = eligibilityFactory.build()

    const cards = eligibilityToEligibilityCards(eligibility)

    expect(cards).toHaveLength(5)
    expect(cards[0].heading).toContain('Approved premises (CAS1)')
    expect(cards[1].heading).toContain('CAS2 for HDC')
    expect(cards[2].heading).toContain('CAS2 for court bail')
    expect(cards[3].heading).toContain('CAS2 for prison bail')
    expect(cards[4].heading).toContain('CAS3 (transitional accommodation)')
  })

  it('returns an array of eligibility card objects', () => {
    const eligibility = eligibilityFactory.build({
      cas1: serviceResultFactory.build({ serviceStatus: 'NOT_STARTED' }),
      cas2Hdc: serviceResultFactory.build({ serviceStatus: 'UPCOMING' }),
      cas2CourtBail: serviceResultFactory.build({ serviceStatus: 'NOT_ELIGIBLE' }),
      cas2PrisonBail: serviceResultFactory.build({ serviceStatus: 'AWAITING_ASSESSMENT' }),
      cas3: serviceResultFactory.build({ serviceStatus: 'CONFIRMED' }),
    })

    const cards = eligibilityToEligibilityCards(eligibility)

    expect(cards).toMatchSnapshot()
  })
})
