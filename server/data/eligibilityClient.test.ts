import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import describeClient from '../testutils/describeClient'
import EligibilityClient from './eligibilityClient'
import { eligibilityFactory } from '../testutils/factories'
import apiPaths from '../paths/api'
import crnFactory from '../testutils/crn'

describeClient('EligibilityClient', provider => {
  let eligibilityClient: EligibilityClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>

  beforeEach(() => {
    eligibilityClient = new EligibilityClient(mockAuthenticationClient)
  })

  it('should make a GET request to /cases/:crn/eligibility using user token and return the response body', async () => {
    const eligibility = eligibilityFactory.build()
    const crn = crnFactory()

    await provider.addInteraction({
      state: `Eligibility exists for case with CRN ${crn}`,
      uponReceiving: 'a request to get eligibility for a user case by CRN',
      withRequest: {
        method: 'GET',
        path: apiPaths.eligibility.show({ crn }),
        headers: {
          authorization: 'Bearer test-user-token',
        },
      },
      willRespondWith: {
        status: 200,
        body: eligibility,
      },
    })

    const response = await eligibilityClient.getEligibility('test-user-token', crn)
    expect(response).toEqual(eligibility)
  })
})
