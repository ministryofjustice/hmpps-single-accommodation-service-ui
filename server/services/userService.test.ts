import { ApiResponseDtoListTeam, ApiResponseDtoUser } from '@sas/api'
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

  describe('getProbationRegion', () => {
    it("should return the user's probation area code", async () => {
      userClient.getMe.mockResolvedValue(
        apiResponseFactory.buildResponse<ApiResponseDtoUser>({
          username: 'DELIUS_USER',
          teams: [],
          probationAreaCode: 'N07',
        }),
      )

      const result = await userService.getProbationRegion(token)

      expect(userClient.getMe).toHaveBeenCalledWith(token)
      expect(result).toEqual('N07')
    })

    it('should return null if the user has no probation area code', async () => {
      userClient.getMe.mockResolvedValue(
        apiResponseFactory.buildResponse<ApiResponseDtoUser>({ username: 'NOMIS_USER' }),
      )

      expect(await userService.getProbationRegion(token)).toBeNull()
    })
  })
})
