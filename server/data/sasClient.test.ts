import nock from 'nock'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import SasClient from './sasClient'
import config from '../config'

describe('SASClient', () => {
  let sasClient: SasClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>

  beforeEach(() => {
    mockAuthenticationClient = {
      getToken: jest.fn().mockResolvedValue('test-system-token'),
    } as unknown as jest.Mocked<AuthenticationClient>

    sasClient = new SasClient(mockAuthenticationClient)
  })

  afterEach(() => {
    nock.cleanAll()
    jest.resetAllMocks()
  })

  describe('getHelloWorld', () => {
    it('should make a GET request to /hello-world using system token and return the response body', async () => {
      const token = 'test-user-token'
      nock(config.apis.sasApi.url)
        .get('/hello-world')
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, { message: 'Hello World!' })

      const response = await sasClient.getHelloWorld(token)

      expect(response).toEqual({ message: 'Hello World!' })
    })
  })
})
