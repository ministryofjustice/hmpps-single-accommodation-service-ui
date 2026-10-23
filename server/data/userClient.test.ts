import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { ApiResponseDtoListTeamDto, TeamDto } from '@sas/api'
import type { ApiResponseDtoUserDto } from '@sas/api'
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
    const teams: TeamDto[] = [
      {
        name: 'Team One',
        code: 'team-one-code',
      },
    ]
    const body = apiResponseFactory.buildResponse<ApiResponseDtoListTeamDto>(teams)

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

  it('should make a GET request to /users/me using user token and return the user profile', async () => {
    const body = apiResponseFactory.buildResponse<ApiResponseDtoUserDto>({
      userType: 'DELIUS',
      username: 'test-user',
      deliusUserDetails: { teams: [{ code: 'team-one-code', name: 'Team One' }], probationAreaCode: 'London' },
    })

    await provider.addInteraction({
      state: 'User exists and has a probation area',
      uponReceiving: 'a request to get the current user profile',
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
