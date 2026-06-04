import { UserClient } from '../data'

export default class UserService {
  constructor(private readonly userClient: UserClient) {}

  getTeams(token: string) {
    return this.userClient.getTeams(token)
  }
}
