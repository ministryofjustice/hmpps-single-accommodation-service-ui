import { UserClient } from '../data'

export default class UserService {
  constructor(private readonly userClient: UserClient) {}

  getTeams(token: string) {
    return this.userClient.getTeams(token)
  }

  async getProbationAreaCode(token: string): Promise<string> {
    const response = await this.userClient.getMe(token)
    const probationAreaCode = response.data?.probationAreaCode

    if (response.upstreamFailures?.length || typeof probationAreaCode !== 'string' || !probationAreaCode.trim()) {
      throw new Error('Unable to determine probation area from /users/me')
    }

    return probationAreaCode
  }
}
