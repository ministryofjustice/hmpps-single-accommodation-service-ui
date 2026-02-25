import nock from 'nock'
import OsDataHubClient from './osDataHubClient'
import getPostcodeResponse from '../testutils/fixtures/osDataHubApi/getPostcode.json'
import config from '../config'

describe('osDataHubClient', () => {
  let osDataHubClient: OsDataHubClient

  beforeEach(() => {
    osDataHubClient = new OsDataHubClient()
  })

  afterEach(() => {
    nock.cleanAll()
    jest.resetAllMocks()
  })

  it('should make a GET request to /search/places/v1/postcode with the right query parameters and API key', async () => {
    nock(config.apis.osDataHubApi.url)
      .get('/search/places/v1/postcode')
      .query({ postcode: 'M210BP' })
      .matchHeader('Key', config.apis.osDataHubApi.apiKey)
      .reply(200, getPostcodeResponse)

    const response = await osDataHubClient.getByPostcode('M210BP')

    expect(response).toEqual(getPostcodeResponse)
  })
})
