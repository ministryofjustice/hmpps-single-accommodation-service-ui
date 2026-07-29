import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import describeClient from '../testutils/describeClient'
import apiPaths from '../paths/api'
import { apiResponseFactory } from '../testutils/factories'
import AccommodationClient from './accommodationClient'

describeClient('AccommodationClient', provider => {
  let accommodationClient: AccommodationClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>

  beforeEach(() => {
    accommodationClient = new AccommodationClient(mockAuthenticationClient)
  })

  it('should make a GET request to /cases/{crn}/accommodation-history using user token and return the response body', async () => {
    const body = apiResponseFactory.accommodationHistory()
    const crn = 'X456123'

    await provider.addInteraction({
      state: `Accommodation history exists for crn ${crn}`,
      uponReceiving: 'a request to get accommodation history',
      withRequest: {
        method: 'GET',
        path: apiPaths.cases.accommodationHistory({ crn }),
        headers: {
          authorization: 'Bearer test-user-token',
        },
      },
      willRespondWith: {
        status: 200,
        body,
      },
    })

    const response = await accommodationClient.getAccommodationHistory('test-user-token', 'X456123')
    expect(response).toEqual(body)
  })

  it('should make a GET request to /cases/{crn}/accommodation/summary using user token and return the response body', async () => {
    const body = apiResponseFactory.accommodationSummaries()
    const crn = 'X456123'

    await provider.addInteraction({
      state: `Accommodation summary exists for crn ${crn}`,
      uponReceiving: 'a request to get accommodation summary',
      withRequest: {
        method: 'GET',
        path: apiPaths.cases.accommodation.summary({ crn }),
        headers: {
          authorization: 'Bearer test-user-token',
        },
      },
      willRespondWith: {
        status: 200,
        body,
      },
    })

    const response = await accommodationClient.getAccommodationSummary('test-user-token', crn)
    expect(response).toEqual(body)
  })
})
