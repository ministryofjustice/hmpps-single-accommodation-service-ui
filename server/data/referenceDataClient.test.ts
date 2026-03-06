import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import ReferenceDataClient from './referenceDataClient'
import describeClient from '../testutils/describeClient'
import apiPaths from '../paths/api'
import { referenceDataFactory } from '../testutils/factories'

describeClient('ReferenceDataClient', provider => {
  let referenceDataClient: ReferenceDataClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>

  beforeEach(() => {
    referenceDataClient = new ReferenceDataClient(mockAuthenticationClient)
  })

  it('should make a GET request to /reference-data?type=LOCAL_AUTHORITY_AREAS and return the response body', async () => {
    const referenceData = referenceDataFactory.buildList(3)
    const objectType = 'LOCAL_AUTHORITY_AREAS'
    
    await provider.addInteraction({
      state: `Reference data exists for type ${objectType}`,
      uponReceiving: 'a request to get reference data for a specific type',
      withRequest: {
        method: 'GET',
        path: apiPaths.referenceData({}),
        query: { type: objectType },
        headers: {
          authorization: 'Bearer test-user-token',
        },
      },
      willRespondWith: {
        status: 200,
        body: referenceData,
      },
    })

    const response = await referenceDataClient.getReferenceData('test-user-token', objectType)
    expect(response).toEqual(referenceData)
  })
})
