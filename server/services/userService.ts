import { UserClient } from '../data'

export default class UserService {
  constructor(private readonly userClient: UserClient) {}

  getTeams(token: string) {
    return this.userClient.getTeams(token)
  }

  async getUserLocationCode(token: string): Promise<string> {
    const response = await this.userClient.getMe(token)
    const { data } = response
    const userLocationCode =
      data?.userType === 'NOMIS' ? data?.nomisUserDetails?.prisonCode : data?.deliusUserDetails?.probationAreaCode

    if (response.upstreamFailures?.length || typeof userLocationCode !== 'string' || !userLocationCode.trim()) {
      throw new Error('Unable to determine user location from /users/me')
    }

    return userLocationCode
  }
}
