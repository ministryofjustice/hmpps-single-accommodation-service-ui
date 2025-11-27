import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import CasesClient from './casesClient'
import describeClient from '../testutils/describeClient'
import { caseFactory } from '../testutils/factories'

describeClient('CasesClient', provider => {
  let casesClient: CasesClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>

  beforeEach(() => {
    casesClient = new CasesClient(mockAuthenticationClient)
  })

  it('should make a GET request to /cases using user token and return the response body', async () => {
    const cases = caseFactory.buildList(5)

    await provider.addInteraction({
      state: 'Cases exist for user',
      uponReceiving: 'a request to get user cases',
      withRequest: {
        method: 'GET',
        path: '/cases',
        headers: {
          authorization: 'Bearer test-user-token',
        },
      },
      willRespondWith: {
        status: 200,
        body: cases,
      },
    })

    const response = await casesClient.getCases('test-user-token')
    expect(response).toEqual(cases)
  })
})
