import { EligibilityClient } from '../data'

export default class EligibilityService {
  constructor(private readonly eligibilityClient: EligibilityClient) {}

  getEligibility(token: string, crn: string) {
    return this.eligibilityClient.getEligibility(token, crn)
  }
}
