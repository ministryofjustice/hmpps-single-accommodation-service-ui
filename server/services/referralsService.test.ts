import ReferralsService from './referralsService'
import ReferralsClient from '../data/referralsClient'
import { apiResponseFactory } from '../testutils/factories'
import crnFactory from '../testutils/crn'

jest.mock('../data/referralsClient')

describe('ReferralsService', () => {
  const referralsClient = new ReferralsClient(null) as jest.Mocked<ReferralsClient>
  let referralsService: ReferralsService

  const token = 'test-user-token'

  beforeEach(() => {
    referralsService = new ReferralsService(referralsClient)
  })

  it('should call getReferralHistory on the api client and return its result', async () => {
    const response = apiResponseFactory.referralHistory()
    const crn = crnFactory()
    referralsClient.getReferralHistory.mockResolvedValue(response)

    const result = await referralsService.getReferralHistory(token, crn)

    expect(referralsClient.getReferralHistory).toHaveBeenCalledWith(token, crn)
    expect(result).toEqual(response)
  })
})
