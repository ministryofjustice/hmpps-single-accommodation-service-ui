import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import describeClient from '../testutils/describeClient'
import apiPaths from '../paths/api'
import crnFactory from '../testutils/crn'
import { apiResponseFactory } from '../testutils/factories'
import AccommodationClient from './accommodationClient'
import accommodationSummary from '../testutils/factories/accommodationSummary'

describeClient('AccommodationClient', provider => {
  let accommodationClient: AccommodationClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>
  const token = 'test-user-token'

  beforeEach(() => {
    accommodationClient = new AccommodationClient(mockAuthenticationClient)
  })

  it('should make a GET request to /cases/:crn/accommodation/current', async () => {
    const crn = crnFactory()
    const body = apiResponseFactory.accommodationSummary(accommodationSummary.build())

    await provider.addInteraction({
      state: `Current accommodation exist for case with CRN ${crn}`,
      uponReceiving: 'a request to get current accommodation for a case by CRN',
      withRequest: {
        method: 'GET',
        path: apiPaths.cases.accommodation.current({ crn }),
        headers: {
          authorization: 'Bearer test-user-token',
        },
      },
      willRespondWith: {
        status: 200,
        body,
      },
    })

    const response = await accommodationClient.getCurrentAccommodation(token, crn)
    expect(response).toEqual(body)
  })

  it('should make a GET request to /cases/:crn/accommodation/next', async () => {
    const crn = crnFactory()
    const body = apiResponseFactory.accommodationSummary(accommodationSummary.build())

    await provider.addInteraction({
      state: `Next accommodation exist for case with CRN ${crn}`,
      uponReceiving: 'a request to get next accommodation for a case by CRN',
      withRequest: {
        method: 'GET',
        path: apiPaths.cases.accommodation.next({ crn }),
        headers: {
          authorization: 'Bearer test-user-token',
        },
      },
      willRespondWith: {
        status: 200,
        body,
      },
    })

    const response = await accommodationClient.getNextAccommodation(token, crn)
    expect(response).toEqual(body)
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
})
