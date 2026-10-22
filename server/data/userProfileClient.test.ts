import nock from 'nock'
import UserClient from './userClient'
import config from '../config'
import type { UserProfileResponse } from '../interfaces/userProfile'

describe('UserClient.getMe', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  it('gets the authenticated profile with the user token', async () => {
    const body: UserProfileResponse = {
      data: { teams: [{ code: 'TEAM', name: 'Team name' }], probationAreaCode: 'London' },
      upstreamFailures: [],
    }
    const scope = nock(config.apis.sasApi.url)
      .get('/user/me')
      .matchHeader('authorization', 'Bearer user-token')
      .reply(200, body)

    await expect(new UserClient(null).getMe('user-token')).resolves.toEqual(body)
    expect(scope.isDone()).toBe(true)
  })
})
