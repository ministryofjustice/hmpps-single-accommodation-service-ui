import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import describeClient from '../testutils/describeClient'
import { apiResponseFactory } from '../testutils/factories'
import apiPaths from '../paths/api'
import CustomListClient from './customListClient'

describeClient('CustomListClient', provider => {
  let customListClient: CustomListClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>

  beforeEach(() => {
    customListClient = new CustomListClient(mockAuthenticationClient)
  })

  it('should make a GET request to /custom-list using user token and return the response body', async () => {
    const body = apiResponseFactory.caseList()

    await provider.addInteraction({
      state: 'Custom list cases exists for user',
      uponReceiving: 'a request to get custom list cases',
      withRequest: {
        method: 'GET',
        path: apiPaths.customList({}),
        headers: {
          authorization: 'Bearer test-user-token',
        },
      },
      willRespondWith: {
        status: 200,
        body,
      },
    })

    const response = await customListClient.getCustomList('test-user-token')
    expect(response).toEqual(body)
  })

  it('should make a POST request to /custom-list using user token and body', async () => {
    const crnList = ['X123456', 'X654321']
    await provider.addInteraction({
      state: 'Custom list can be submitted for user',
      uponReceiving: 'a request to submit a custom list for a user',
      withRequest: {
        method: 'POST',
        path: apiPaths.customList({}),
        headers: {
          authorization: 'Bearer test-user-token',
        },
        body: crnList,
      },
      willRespondWith: {
        status: 201,
        body: null,
      },
    })

    const response = await customListClient.addCustomList('test-user-token', crnList)
    expect(response).toEqual({})
  })
})
