import { ApiResponseDtoListTeamDto } from '@sas/api'
import type { ApiResponseDtoUserDto } from '@sas/api'
import UserClient from '../data/userClient'
import UserService from './userService'
import { apiResponseFactory } from '../testutils/factories'

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

  it('gets the probation area for a Delius user', async () => {
    userClient.getMe.mockResolvedValue(
      apiResponseFactory.buildResponse<ApiResponseDtoUserDto>({
        userType: 'DELIUS',
        username: 'user1',
        deliusUserDetails: { teams: [], probationAreaCode: 'London' },
      }),
    )

    await expect(userService.getUserLocationCode(token)).resolves.toBe('London')
    expect(userClient.getMe).toHaveBeenCalledWith(token)
  })

  it('gets the prison code for a Nomis user', async () => {
    userClient.getMe.mockResolvedValue(
      apiResponseFactory.buildResponse<ApiResponseDtoUserDto>({
        userType: 'NOMIS',
        username: 'user1',
        nomisUserDetails: { prisonCode: 'MDI' },
      }),
    )

    await expect(userService.getUserLocationCode(token)).resolves.toBe('MDI')
    expect(userClient.getMe).toHaveBeenCalledWith(token)
  })

  it.each([undefined, null, '', '  ', 123])('rejects an invalid Delius probation area: %s', async probationAreaCode => {
    userClient.getMe.mockResolvedValue({
      data: { userType: 'DELIUS', username: 'user1', deliusUserDetails: { teams: [], probationAreaCode } },
      upstreamFailures: [],
    } as ApiResponseDtoUserDto)

    await expect(userService.getUserLocationCode(token)).rejects.toThrow(
      'Unable to determine user location from /users/me',
    )
  })

  it.each([undefined, null, '', '  ', 123])('rejects an invalid Nomis prison code: %s', async prisonCode => {
    userClient.getMe.mockResolvedValue({
      data: { userType: 'NOMIS', username: 'user1', nomisUserDetails: { prisonCode } },
      upstreamFailures: [],
    } as ApiResponseDtoUserDto)

    await expect(userService.getUserLocationCode(token)).rejects.toThrow(
      'Unable to determine user location from /users/me',
    )
  })

  it('rejects profiles with upstream failures', async () => {
    userClient.getMe.mockResolvedValue(apiResponseFactory.withUpstreamFailures<ApiResponseDtoUserDto>())

    await expect(userService.getUserLocationCode(token)).rejects.toThrow(
      'Unable to determine user location from /users/me',
    )
  })

  it('propagates API errors', async () => {
    const error = new Error('API unavailable')
    userClient.getMe.mockRejectedValue(error)

    await expect(userService.getUserLocationCode(token)).rejects.toBe(error)
  })
})
