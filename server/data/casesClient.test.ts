import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import nock from 'nock'
import CasesClient from './casesClient'
import config from '../config'

describe('cases client', () => {
  let casesClient: CasesClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>

  beforeEach(() => {
    casesClient = new CasesClient(mockAuthenticationClient)
  })

  afterEach(() => {
    nock.cleanAll()
    jest.resetAllMocks()
  })

  describe('getCurrentTime', () => {
    it('should make a GET request to /cases using user token and return the response body', async () => {
      nock(config.apis.sasApi.url)
        .get('/cases')
        .matchHeader('authorization', 'Bearer test-user-token')
        .reply(200, { cases: [] })

      const response = await casesClient.getCases('test-user-token')

      expect(response).toEqual({ cases: [] })
    })
  })
})
