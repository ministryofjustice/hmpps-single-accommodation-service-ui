import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import CasesClient from './casesClient'
import describeClient from '../testutils/describeClient'
import { apiResponseFactory } from '../testutils/factories'
import apiPaths from '../paths/api'

describeClient('CasesClient', provider => {
  let casesClient: CasesClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>

  beforeEach(() => {
    casesClient = new CasesClient(mockAuthenticationClient)
  })

  it('should make a GET request to /case-list using user token and return the response body', async () => {
    const body = apiResponseFactory.caseList()

    await provider.addInteraction({
      state: 'Cases exist for user',
      uponReceiving: 'a request to get user cases',
      withRequest: {
        method: 'GET',
        path: apiPaths.cases.index({}),
        headers: {
          authorization: 'Bearer test-user-token',
        },
      },
      willRespondWith: {
        status: 200,
        body,
      },
    })

    const response = await casesClient.getCases('test-user-token')
    expect(response).toEqual(body)
  })

  // TODO: Reinstate when new case list endpoint accepts parameters
  it.skip('should make a GET request to /case-list using user token and query parameters and return the response body', async () => {
    const body = apiResponseFactory.caseList()

    await provider.addInteraction({
      state: 'Cases exist for user with requested parameters',
      uponReceiving: 'a request to get user cases with query parameters',
      withRequest: {
        method: 'GET',
        path: apiPaths.cases.index({}),
        query: {
          searchTerm: 'bob',
          riskLevel: 'LOW',
        },
        headers: {
          authorization: 'Bearer test-user-token',
        },
      },
      willRespondWith: {
        status: 200,
        body,
      },
    })

    const response = await casesClient.getCases('test-user-token', { searchTerm: 'bob', riskLevel: 'LOW' })
    expect(response).toEqual(body)
  })

  it('should make a GET request to /cases/:crn using user token and return the response body', async () => {
    const body = apiResponseFactory.case()
    const {
      data: { crn },
    } = body

    await provider.addInteraction({
      state: `Case with CRN ${crn} exists for user`,
      uponReceiving: 'a request to get a user case by CRN',
      withRequest: {
        method: 'GET',
        path: apiPaths.cases.show({ crn }),
        headers: {
          authorization: 'Bearer test-user-token',
        },
      },
      willRespondWith: {
        status: 200,
        body,
      },
    })

    const response = await casesClient.getCase('test-user-token', crn)
    expect(response).toEqual(body)
  })
})
