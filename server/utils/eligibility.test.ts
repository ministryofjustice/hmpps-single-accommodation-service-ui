import { eligibilityToEligibilityCards } from './eligibility'
import { eligibilityFactory, serviceResultFactory } from '../testutils/factories'

describe('eligibility utilities', () => {
  describe('eligibilityToEligibilityCards', () => {
    it('returns eligibility cards for each service', () => {
      const eligibility = eligibilityFactory.build({
        cas1: serviceResultFactory.build({ serviceStatus: 'NOT_STARTED' }),
        cas2Hdc: serviceResultFactory.build({ serviceStatus: 'UPCOMING' }),
        cas2CourtBail: serviceResultFactory.build({ serviceStatus: 'NOT_ELIGIBLE' }),
        cas3: serviceResultFactory.build({ serviceStatus: 'ARRIVED' }),
      })

      const cards = eligibilityToEligibilityCards(eligibility)

      expect(cards).toHaveLength(5)
      expect(cards[0]).toContain('Approved premises (CAS1)')
      expect(cards[1]).toContain('CAS2 for HDC')
      expect(cards[2]).toContain('CAS2 for court bail')
      expect(cards[3]).toContain('CAS2 for prison bail')
      expect(cards[4]).toContain('CAS3 (transitional accommodation)')
    })

    it('returns a formatted eligibility card', () => {
      const eligibility = eligibilityFactory.build({
        cas1: serviceResultFactory.build({
          serviceStatus: 'NOT_STARTED',
          actions: ['Action1!', 'Action2!'],
        }),
      })

      const [card] = eligibilityToEligibilityCards(eligibility)

      expect(card).toMatchSnapshot()
    })

    it.each([
      [['Start referral', 'Notes'], 'NOT_STARTED' as const],
      [['Notes'], 'NOT_ELIGIBLE' as const],
      [['Notes'], 'UPCOMING' as const],
      [['Referral and notes'], 'ARRIVED' as const],
    ])('renders links %s for status %s', (links, status) => {
      const eligibility = eligibilityFactory.build({
        cas1: serviceResultFactory.build({ serviceStatus: status }),
      })

      const [card] = eligibilityToEligibilityCards(eligibility)
      for (const link of links) {
        expect(card).toContain(link)
      }
    })
  })
})
