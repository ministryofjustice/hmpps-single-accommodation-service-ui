import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import describeClient from '../testutils/describeClient'
import OtherReferralsClient from './otherReferralsClient'
import { otherAccommodationReferralCommandFactory } from '../testutils/factories'
import apiPaths from '../paths/api'
import crnFactory from '../testutils/crn'

describeClient('OtherReferralsClient', provider => {
  let client: OtherReferralsClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>

  beforeEach(() => {
    client = new OtherReferralsClient(mockAuthenticationClient)
  })

  it('should make a POST request to /cases/:crn/other-referrals with data', async () => {
    const crn = crnFactory()
    const command = otherAccommodationReferralCommandFactory.build()

    await provider.addInteraction({
      state: `Other referral can be submitted for case with CRN ${crn}`,
      uponReceiving: 'a request to submit an Other Referral for a user case by CRN',
      withRequest: {
        method: 'POST',
        path: apiPaths.cases.otherReferrals.submit({ crn }),
        headers: {
          authorization: 'Bearer test-user-token',
        },
        body: command,
      },
      willRespondWith: {
        status: 201,
        body: {},
      },
    })

    const response = await client.submit('test-user-token', crn, command)
    expect(response).toEqual({})
  })
})
