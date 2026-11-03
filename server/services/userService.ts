import { UserClient } from '../data'

export default class UserService {
  constructor(private readonly userClient: UserClient) {}

  getTeams(token: string) {
    return this.userClient.getTeams(token)
  }

  async getUserLocationCode(token: string): Promise<string> {
    const response = await this.userClient.getMe(token)
    const { data } = response
    const rawCode =
      data?.userType === 'NOMIS' ? data?.nomisUserDetails?.prisonCode : data?.deliusUserDetails?.probationAreaCode
    const userLocationCode = typeof rawCode === 'string' ? rawCode.trim() : undefined

    if (response.upstreamFailures?.length || !userLocationCode) {
      throw new Error('Unable to determine user location from /users/me')
    }

    return userLocationCode
  }
}
