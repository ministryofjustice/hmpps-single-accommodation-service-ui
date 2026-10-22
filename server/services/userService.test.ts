import { ApiResponseDtoListTeamDto } from '@sas/api'
import UserClient from '../data/userClient'
import UserService from './userService'
import { apiResponseFactory } from '../testutils/factories'
import type { UserProfileResponse } from '../interfaces/userProfile'

jest.mock('../data/userClient.ts')

describe('userService', () => {
  const userClient = new UserClient(null) as jest.Mocked<UserClient>
  let userService: UserService

  const token = 'test-user-token'

  beforeEach(() => {
    jest.resetAllMocks()
    userService = new UserService(userClient)
  })

  it("should call getTeams on the API client and return the user's teams", async () => {
    userClient.getTeams.mockResolvedValue(
      apiResponseFactory.buildResponse<ApiResponseDtoListTeamDto>([{ code: 'TEAM_CODE', name: 'Team CAS' }]),
    )

    const result = await userService.getTeams(token)

    expect(userClient.getTeams).toHaveBeenCalledWith(token)
    expect(result).toEqual({ data: [{ code: 'TEAM_CODE', name: 'Team CAS' }], upstreamFailures: [] })
  })

  it('gets the probation area from the current user profile', async () => {
    userClient.getMe.mockResolvedValue(
      apiResponseFactory.buildResponse<UserProfileResponse>({ teams: [], probationAreaCode: 'London' }),
    )

    await expect(userService.getProbationAreaCode(token)).resolves.toBe('London')
    expect(userClient.getMe).toHaveBeenCalledWith(token)
  })

  it.each([undefined, null, '', '  ', 123])('rejects an invalid probation area: %s', async probationAreaCode => {
    userClient.getMe.mockResolvedValue({
      data: { teams: [], probationAreaCode },
      upstreamFailures: [],
    } as UserProfileResponse)

    await expect(userService.getProbationAreaCode(token)).rejects.toThrow(
      'Unable to determine probation area from /user/me',
    )
  })

  it('rejects profiles with upstream failures', async () => {
    userClient.getMe.mockResolvedValue(apiResponseFactory.withUpstreamFailures<UserProfileResponse>())

    await expect(userService.getProbationAreaCode(token)).rejects.toThrow(
      'Unable to determine probation area from /user/me',
    )
  })

  it('propagates API errors', async () => {
    const error = new Error('API unavailable')
    userClient.getMe.mockRejectedValue(error)

    await expect(userService.getProbationAreaCode(token)).rejects.toBe(error)
  })
})
