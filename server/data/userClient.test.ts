import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { ApiResponseDtoListTeam, ApiResponseDtoUser, DeliusUserDto, Team } from '@sas/api'
import describeClient from '../testutils/describeClient'
import UserClient from './userClient'
import apiPaths from '../paths/api'
import { apiResponseFactory } from '../testutils/factories'

describeClient('UserClient', provider => {
  let userClient: UserClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>

  beforeEach(() => {
    userClient = new UserClient(mockAuthenticationClient)
  })

  it("should make a GET request to /user/teams using user token and return the user's teams", async () => {
    const teams: Team[] = [
      {
        name: 'Team One',
        code: 'team-one-code',
      },
    ]
    const body = apiResponseFactory.buildResponse<ApiResponseDtoListTeam>(teams)

    await provider.addInteraction({
      state: 'User exists and has teams',
      uponReceiving: 'a request to get user profile',
      withRequest: {
        method: 'GET',
        path: apiPaths.user.teams({}),
        headers: {
          authorization: 'Bearer test-user-token',
        },
      },
      willRespondWith: {
        status: 200,
        body,
      },
    })

    const response = await userClient.getTeams('test-user-token')
    expect(response).toEqual(body)
  })
  it('should make a GET request to /user/me using user token and return the user details', async () => {
    const user: DeliusUserDto = {
      username: 'DELIUS_USER',
      teams: [{ name: 'Team One', code: 'team-one-code' }],
      probationAreaCode: 'N07',
    }
    const body = apiResponseFactory.buildResponse<ApiResponseDtoUser>(user)

    await provider.addInteraction({
      state: 'User exists',
      uponReceiving: 'a request to get the current user',
      withRequest: {
        method: 'GET',
        path: apiPaths.user.me({}),
        headers: {
          authorization: 'Bearer test-user-token',
        },
      },
      willRespondWith: {
        status: 200,
        body,
      },
    })

    const response = await userClient.getMe('test-user-token')
    expect(response).toEqual(body)
  })
})
