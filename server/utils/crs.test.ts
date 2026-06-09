import { crsStatusCard } from './crs'
import { crsServiceResultFactory, crsSubmissionFactory } from '../testutils/factories'

describe('CRS utilities', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-09'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('crsStatusCard', () => {
    it('returns a status card for a NOT_ELIGIBLE CRS service result', () => {
      const crsServiceResult = crsServiceResultFactory.notEligible().build()

      expect(crsStatusCard(crsServiceResult)).toMatchSnapshot()
    })

    it('returns a status card for a NOT_STARTED CRS service result', () => {
      const crsServiceResult = crsServiceResultFactory.notStarted().build()
      crsServiceResult.serviceResult.url = 'https://example.com/start'

      expect(crsStatusCard(crsServiceResult)).toMatchSnapshot()
    })

    it('returns a status card for a SUBMITTED CRS service result', () => {
      const crsServiceResult = crsServiceResultFactory.submitted().build({
        commissionedRehabilitativeServices: crsSubmissionFactory.build({
          submissionDate: '2026-06-06',
        }),
      })
      crsServiceResult.serviceResult.url = 'https://example.com/view-referral'

      expect(crsStatusCard(crsServiceResult)).toMatchSnapshot()
    })
  })
})
