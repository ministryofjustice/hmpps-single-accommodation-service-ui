import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import describeClient from '../testutils/describeClient'
import apiPaths from '../paths/api'
import crnFactory from '../testutils/crn'
import { apiResponseFactory } from '../testutils/factories'
import AccommodationsClient from './accommodationsClient'

describeClient('AccommodationsClient', provider => {
  let accommodationsClient: AccommodationsClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>
  const token = 'test-user-token'

  beforeEach(() => {
    accommodationsClient = new AccommodationsClient(mockAuthenticationClient)
  })

  it('should make a GET request to /cases/:crn/accommodations/current', async () => {
    const crn = crnFactory()
    const body = apiResponseFactory.accommodationSummary()

    await provider.addInteraction({
      state: `Current accommodation exist for case with CRN ${crn}`,
      uponReceiving: 'a request to get current accommodation for a case by CRN',
      withRequest: {
        method: 'GET',
        path: apiPaths.cases.accommodations.current({ crn }),
        headers: {
          authorization: 'Bearer test-user-token',
        },
      },
      willRespondWith: {
        status: 200,
        body,
      },
    })

    const response = await accommodationsClient.getCurrentAccommodation(token, crn)
    expect(response).toEqual(body)
  })

  it('should make a GET request to /cases/:crn/accommodations/next', async () => {
    const crn = crnFactory()
    const body = apiResponseFactory.accommodationSummary()

    await provider.addInteraction({
      state: `Next accommodation exist for case with CRN ${crn}`,
      uponReceiving: 'a request to get next accommodation for a case by CRN',
      withRequest: {
        method: 'GET',
        path: apiPaths.cases.accommodations.next({ crn }),
        headers: {
          authorization: 'Bearer test-user-token',
        },
      },
      willRespondWith: {
        status: 200,
        body,
      },
    })

    const response = await accommodationsClient.getNextAccommodation(token, crn)
    expect(response).toEqual(body)
  })
})
