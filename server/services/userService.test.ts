import { ApiResponseDtoListTeam } from '@sas/api'
import UserClient from '../data/userClient'
import UserService from './userService'
import { apiResponseFactory } from '../testutils/factories'

jest.mock('../data/userClient.ts')

describe('userService', () => {
  const userClient = new UserClient(null) as jest.Mocked<UserClient>
  let userService: UserService

  const token = 'test-user-token'

  beforeEach(() => {
    userService = new UserService(userClient)
  })

  it("should call getTeams on the API client and return the user's teams", async () => {
    userClient.getTeams.mockResolvedValue(
      apiResponseFactory.buildResponse<ApiResponseDtoListTeam>([{ code: 'TEAM_CODE', name: 'Team CAS' }]),
    )

    const result = await userService.getTeams(token)

    expect(userClient.getTeams).toHaveBeenCalledWith(token)
    expect(result).toEqual({ data: [{ code: 'TEAM_CODE', name: 'Team CAS' }], upstreamFailures: [] })
  })
})
