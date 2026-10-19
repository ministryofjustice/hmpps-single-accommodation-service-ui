import { UserClient } from '../data'

export default class UserService {
  constructor(private readonly userClient: UserClient) {}

  getTeams(token: string) {
    return this.userClient.getTeams(token)
  }

  async getProbationRegion(token: string): Promise<string | null> {
    const { data } = await this.userClient.getMe(token)

    return (data && 'probationAreaCode' in data && data.probationAreaCode) || null
  }
}
