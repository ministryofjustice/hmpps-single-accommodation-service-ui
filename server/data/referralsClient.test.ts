import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import ReferralsClient from './referralsClient'
import describeClient from '../testutils/describeClient'
import { referralFactory } from '../testutils/factories'
import crnFactory from '../testutils/crn'
import apiPaths from '../paths/api'

describeClient('ReferralsClient', provider => {
  let referralsClient: ReferralsClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>

  beforeEach(() => {
    referralsClient = new ReferralsClient(mockAuthenticationClient)
  })

  it('should make a GET request to /application-histories/:crn using user token and return the response body', async () => {
    const referrals = referralFactory.buildList(3)
    const crn = crnFactory()

    await provider.addInteraction({
      state: `Referral history exists for case with CRN ${crn}`,
      uponReceiving: 'a request to get referral history for a user case by CRN',
      withRequest: {
        method: 'GET',
        path: apiPaths.referrals.history({ crn }),
        headers: {
          authorization: 'Bearer test-user-token',
        },
      },
      willRespondWith: {
        status: 200,
        body: referrals,
      },
    })

    const response = await referralsClient.getReferralHistory('test-user-token', crn)
    expect(response).toEqual(referrals)
  })
})
