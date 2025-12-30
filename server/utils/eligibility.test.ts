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

      expect(cards).toHaveLength(4)
      expect(cards[0]).toContain('Approved premises (CAS1)')
      expect(cards[1]).toContain('CAS2 for HDC')
      expect(cards[2]).toContain('CAS2 for court bail')
      expect(cards[3]).toContain('CAS3 (transitional accommodation)')
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

    it('returns the correct links for a given status', () => {
      const eligibility = eligibilityFactory.build({
        cas1: serviceResultFactory.build({ serviceStatus: 'NOT_STARTED' }),
      })

      const [card] = eligibilityToEligibilityCards(eligibility)

      expect(card).toContain('Start referral')
    })
  })
})
