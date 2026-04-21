import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import ReferenceDataClient from './referenceDataClient'
import describeClient from '../testutils/describeClient'
import apiPaths from '../paths/api'
import { apiResponseFactory } from '../testutils/factories'

describeClient('ReferenceDataClient', provider => {
  let referenceDataClient: ReferenceDataClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>
  const token = 'some token'

  beforeEach(() => {
    referenceDataClient = new ReferenceDataClient(mockAuthenticationClient)
  })

  it('should make a GET request to /reference-data?type=LOCAL_AUTHORITY_AREAS and return the response body', async () => {
    const body = apiResponseFactory.referenceData()
    const objectType = 'LOCAL_AUTHORITY_AREAS'

    await provider.addInteraction({
      state: `Reference data exists for type ${objectType}`,
      uponReceiving: 'a request to get reference data for a specific type',
      withRequest: {
        method: 'GET',
        path: apiPaths.referenceData({}),
        query: { type: objectType },
      },
      willRespondWith: {
        status: 200,
        body,
      },
    })

    const response = await referenceDataClient.getReferenceData(token, objectType)
    expect(response).toEqual(body)
  })
})
