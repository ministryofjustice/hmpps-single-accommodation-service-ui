import { ReferralsClient } from '../data'

export default class ReferralsService {
  constructor(private readonly referralsClient: ReferralsClient) {}

  getReferralHistory(token: string, crn: string) {
    return this.referralsClient.getReferralHistory(token, crn)
  }
}
